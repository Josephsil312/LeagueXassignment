import React, { useState, useEffect } from 'react';
import {
    Text,
    StyleSheet,
    View,
    Platform,
    FlatList,
    TouchableOpacity,
    Alert,
    Image,
    Pressable,
    SafeAreaView,
    BackHandler,
    ScrollView,
    Button,
    ActivityIndicator,
} from "react-native";
import DocumentPicker from 'react-native-document-picker';
import storage, { getDownloadURL } from '@react-native-firebase/storage';
import ReactNativeBlobUtil from 'react-native-blob-util';
import database from '@react-native-firebase/database';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import ProgressBar from './ProgressBar';
import { useTasks } from './FileuploadsContextProviders';
import notifee, { EventType } from '@notifee/react-native';

const Uploading = () => {
    const navigation = useNavigation();
    const [uploadProgress, setUploadProgress] = useState<{ [id: string]: number }>({});
    const [uploading, setUploading] = useState(false);
    const isFocused = useIsFocused();
    const tasksContext = useTasks();
    const [uploadTasks, setUploadTasks] = useState<{ [id: string]: any }>({});
    const [loading, setLoading] = useState(true);

    if (!tasksContext) {
        throw new Error('useTasks must be used within a TasksContextProvider');
    }

    const { fileList, setFileList, setSelectedFile } = tasksContext
    const [speed, setSpeed] = useState<{ [id: string]: string }>({});
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    const pickDocument = async () => {
        try {
            const response = await DocumentPicker.pick({
                type: [DocumentPicker.types.pdf, DocumentPicker.types.ppt, DocumentPicker.types.doc],
                mode: 'open',
                allowMultiSelection: true,
            });
            const files = await Promise.all(response.map(async file => {
                const path = await normalizePath(file.uri);
                const result = await ReactNativeBlobUtil.fs.readFile(path, 'base64');
                return { result, file, status: 'uploading' };
            }));
            const invalidFiles = files.filter(file => (file.file.size || 0) > MAX_FILE_SIZE || !isFileTypeSupported((file.file.type) || ''));
            if (invalidFiles.length > 0) {
                const invalidFileNames = invalidFiles.map(file => file.file.name).join(', ');
                Alert.alert(`File size exceeded 10MB: ${invalidFileNames}`);
                return;
            }
            setUploadProgress({});
            setUploading(true);
            await uploadFiles(files);
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                Alert.alert('User cancelled the upload...');
            } else {
                console.error('Error when picking files', err);
            }
        }
    };

    const isFileTypeSupported = (fileType: string) => {
        // Add supported file types here
        const supportedTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        return supportedTypes.includes(fileType);
    };

    async function normalizePath(path: string) {
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            const filePrefix = 'file://';
            if (path.startsWith(filePrefix)) {
                path = path.substring(filePrefix.length)
                try {
                    path = decodeURI(path);
                } catch (err) {
                    console.log(err, 'error in file path')
                }
            }
        }
        return path
    }

    const uploadFiles = async (files: { result: string; file: any }[]) => {
        try {
            await Promise.all(files.map(({ result, file }: { result: string; file: any }) => uploadFile(result, file)));
        } catch (err) {
            console.log('Error uploading files', err);
        } finally {
            setUploading(false);
        }
    };

    const uploadFile = async (result: string, file: any) => {
        setUploading(true);
        const startTime = new Date().getTime();
        file.uploadTask = null;
        const uploadTask = storage().ref(`allFiles/${file.name}`).putString(result, 'base64');
        const uniqueId = generateTimestampId();
        setUploadTasks(prev => ({ ...prev, [uniqueId]: uploadTask }));
        return new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed',
                async (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    const elapsedTime = (new Date().getTime() - startTime) / 1000;
                    const uploadSpeed = calculateUploadSpeed(snapshot.bytesTransferred, elapsedTime);
                    setSpeed(prev => ({ ...prev, [uniqueId]: uploadSpeed }));
                    setUploadProgress(prev => ({ ...prev, [uniqueId]: progress }));
                    switch (snapshot.state) {
                        case 'paused':
                            console.log(`Upload for ${file.name} is paused`);
                            
                            break;
                        case 'running':
                            console.log(`Upload for ${file.name} is running`);
                            
                            break;
                        case 'success':
                            await onDisplayNotification(file.name);
                            break;
                    }
                },
                (error) => {
                    switch (error.code) {
                        case 'storage/unauthorized':
                            console.error(`Permission issue for ${file.name}`, error);
                            break;
                        case 'storage/canceled':
                            console.log(`User cancelled the upload for ${file.name}`, error);
                            break;
                        case 'storage/unknown':
                            console.error(`Unknown error for ${file.name}`, error);
                            break;
                    }
                    setFileList(prev => prev.map(item => item.fileName === file.name ? { ...item, status: 'failed' } : item));
                    reject(error);
                },
                () => {
                    getDownloadURL((uploadTask.snapshot?.ref)).then((downloadURL: string) => {
                        saveFileToRealTimeDataBase(downloadURL, file);
                        setFileList(prev => prev.map(item => item.fileName === file.name ? { ...item, status: 'uploaded' } : item));
                        resolve();
                    });
                }
            );
            file.uploadTask = () => {
                uploadTask.cancel();
                Alert.alert(`Upload for ${file.name} has been cancelled`);
                setFileList(prev => prev.map(item => item.fileName === file.name ? { ...item } : item));
                
            };

        });
    }

    function generateTimestampId() {
        return new Date().getTime().toString(); // Get current timestamp as string
    }

    const saveFileToRealTimeDataBase = (downloadURL: string, file: any) => {
        const uniqueKey = database().ref().push().key;
        database().ref(`allFiles/${uniqueKey}`).update({
            fileName: file.name,
            fileType: file.type,
            fileURL: downloadURL,
            id: generateTimestampId()
        });
    };

    useEffect(() => {
        setFileList([])
        const onChildAdded = database().ref(`allFiles`).on('child_added', (snapshot) => {
            setFileList((prevFiles) => [...prevFiles, snapshot.val()]);
        })
        return () => database().ref(`allFiles`).off('child_added', onChildAdded);
    }, [])

    const calculateUploadSpeed = (bytesTransferred: number, elapsedTime: number) => {
        if (elapsedTime === 0) {
            return '0 KB/s'; // Avoid division by zero
        }
        const kilobytes = bytesTransferred / 1024;
        const speed = kilobytes / elapsedTime;
        return speed.toFixed(1) + ' KB/s';
    };

    async function onDisplayNotification(fileNamee: string) {
        // Request permissions (required for iOS)
        await notifee.requestPermission()

        // Create a channel (required for Android)
        const channelId = await notifee.createChannel({
            id: 'default',
            name: 'Default Channel',
        });

        // Display a notification
        await notifee.displayNotification({
            title: 'Status: success',
            body: `${fileNamee} file uploaded successfully!`,
            android: {
                channelId,
                smallIcon: 'ic_launcher',
                pressAction: {
                    id: 'default',
                },
            },
        });
    }

    async function onBackgroundEvent(event:any) {
        console.log('event type', typeof (event))
        if (event.type === EventType.DISMISSED) {
            console.log('User dismissed notification', event.notification);
        } else if (event.type === EventType.PRESS) {
            console.log('User pressed notification', event.notification);
        }
    }

    notifee.onBackgroundEvent(onBackgroundEvent);

    useEffect(() => {
        if (isFocused) {
            const backAction = () => {
                Alert.alert('Hold on!', 'Are you sure you want to exit?', [
                    {
                        text: 'Cancel',
                        onPress: () => null,
                        style: 'cancel',
                    },
                    { text: 'YES', onPress: () => BackHandler.exitApp() },
                ]);
                return true;
            };
            const backHandler = BackHandler.addEventListener(
                'hardwareBackPress',
                backAction,
            );
            return () => backHandler.remove();
        }
    }, [isFocused]);

    const cancelUpload = (id: string) => {
        const uploadTask = uploadTasks[id];
        if (uploadTask) {
          uploadTask.cancel().then(() => {
            setFileList(prev => prev.map(item => item.id === id ? { ...item, status: 'cancelled' } : item));
            Alert.alert(`Upload has been cancelled`);
          }).catch((error: any) => {
            console.log(`Error cancelling upload for ${id}: `, error);
          });
        }
      };
   
      useEffect(() => {
        // Simulate loading files (e.g., from a server or local storage)
        setTimeout(() => {
          setLoading(false); // Set loading to false after data is loaded
        }, 2000); // Simulated loading time
      }, []);
      
    return (
        <SafeAreaView style={styles.container}>
            <View>
                {uploading && (
                    <>
                        {Object.entries(uploadProgress).map(([id, progress]) => (
                            <View key={id}>
                                <ProgressBar progress={progress} />
                                <Text style={{ color: 'black' }}>{speed[id]}</Text>
                                <Pressable  style = {{height:40,width:150,backgroundColor:'#C0DFF7'}}onPress={() => cancelUpload(id)} ><Text style = {{textAlign:'center',padding:3,color:'#039BE5'}}>Cancel Upload</Text></Pressable>
                            </View>
                        ))}
                    </>
                )}
            </View>
            <View style={styles.flatlistContainer}>
                <Pressable style={styles.browseToUpload} onPress={pickDocument}>
                    <Image source={require('../assets/cloud.png')} style={styles.uploadImage} />
                    <Text style={styles.browseToUploadText}>Browse File to upload</Text>
                </Pressable>
                
                {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <FlatList
            data={fileList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ScrollView>
                <TouchableOpacity onPress={() => { setSelectedFile(item); navigation.navigate('FilePreview'); }}>
                  <View style={styles.fileItem}>
                    <Image source={require('../assets/docs.png')} style={{ width: 25, height: 25, marginRight: 10 }} />
                    <View>
                      <Text style={{ color: 'black' }}>Filename: {item.fileName}</Text>
                      <Text style={{ color: 'black' }}>File Type: {item.fileType}</Text>
                      <Text style={{ color: 'black' }}>
                        File status: {item.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            )}
          />
        )}
                
            </View>
            
        </SafeAreaView>
    );
}
export default Uploading
const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        alignItems: 'center',
        padding: 10,
        height: '100%',
        backgroundColor: '#039BE5'
    },
    fileItem: {
        backgroundColor: '#C0DFF7',
        paddingHorizontal: 14,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        justifyContent: 'flex-start',
        elevation: 3,
        paddingTop: 9,
        paddingBottom: 9,
        marginTop: 8
    },
    flatlistContainer:{
        justifyContent: 'flex-end', 
        backgroundColor: 'white', 
        width: '100%'
    },
    browseToUpload:{
        borderWidth: 2, 
        alignSelf: 'center', 
        borderStyle: "dotted", 
        padding: 10, 
        borderColor: '#2B94E8', 
        width: 190, 
        height: 120
    },
    uploadImage:{
        width: 60, 
        height: 60, 
        alignSelf: 'center'
    },
    browseToUploadText:{
         color: '#2B94E8',
         textAlign: 'center' 
        
    }
});
