import React, { useState, useEffect,useContext } from 'react';
import {
    Text,
    StyleSheet,
    View,
    Button,
    PermissionsAndroid,
    Platform,
    FlatList,
    Pressable,
    TouchableOpacity,
} from "react-native";
import DocumentPicker from 'react-native-document-picker';
import storage, { getDownloadURL } from '@react-native-firebase/storage';
import ReactNativeBlobUtil from 'react-native-blob-util';
import database from '@react-native-firebase/database';
import { NavigationContext, NavigationProp, ParamListBase, useIsFocused, useNavigation } from '@react-navigation/native';
import ProgressBar from './ProgressBar';

// interface Props {
//     navigation: NavigationProp<ParamListBase>;
//   }
interface FileItem {
    fileName: string;
    fileType: string;
    fileURL: string;
    id: string;
    status:'uploading' | 'uploaded' | 'failed';
    uploadTask?:any;
}

 const  Uploading = () => {
    const navigation = useNavigation();
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [fileList, setFileList] = useState<FileItem[]>([]);
    const [speed,setSpeed] = useState('')
    const pickDocument = async () => {
        try {
            const response = await DocumentPicker.pick({
                type: [DocumentPicker.types.pdf,DocumentPicker.types.ppt,DocumentPicker.types.doc],
                mode: 'open',
                allowMultiSelection: true,
                
            });
            
            const path = await normalizePath(response[0].uri)
            const result = await ReactNativeBlobUtil.fs.readFile(path, 'base64')
            setUploadProgress(0); // Reset progress
            setUploading(true);
            uploadFile(result, response)

        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                console.log('User cancelled the upload...');
            } else {
                console.error(err,'Error when picked a file');
            }
        }
    };

    async function normalizePath(path) {
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            const filePrefix = 'file://';
            if (path.startsWith(filePrefix)) {
                path = path.substring(filePrefix.length)
                try {
                    path = decodeURI(path);
                } catch (err) {
                    console.log(err,'error in file path')
                }
            }
        }
        return path
    }
    const uploadFile = async (result, file) => {
        setUploading(true);
        const startTime = new Date().getTime();
        const uploadTask = storage().ref(`allFiles/${file.name}`).putString(result, 'base64');
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                const elapsedTime = (new Date().getTime() - startTime) / 1000; // Calculate elapsed time in seconds
            const uploadSpeed = calculateUploadSpeed(snapshot.bytesTransferred, elapsedTime);
            console.log('Upload is ' + progress + '% done at ' + uploadSpeed);
            setSpeed(uploadSpeed)
            // ... (rest of logic)
                setUploadProgress(progress);
                console.log('Upload is ' + progress + '% done');
                switch (snapshot.state) {
                    case 'paused':
                        console.log('Upload is paused');
                    
                        break;
                    case 'running':
                        console.log('Upload is running');
                       
                        break;
                }
            },
            (error) => {
                switch (error.code) {
                    case 'storage/unauthorized':
                        // User doesn't have permission to access the object
                        console.log(error,'Persimmsion issue')
                        setUploading(false);
                        break;
                    case 'storage/canceled':
                        // User canceled the upload
                        console.log(error,'user cancelled the upload')
                        setUploading(false);
                        break;

                    // ...

                    case 'storage/unknown':
                        console.log(error,'unknown error')
                        setUploading(false);
                        break;
                }
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    saveFileToRealTimeDataBase(downloadURL, file)
                    setUploading(false);
                });
            }
        );
    }
    
    function generateTimestampId() {
        return new Date().getTime().toString(); // Get current timestamp as string
      }
    const saveFileToRealTimeDataBase = (downloadURL, file) => {
        const uniqueKey = database().ref().push().key;
        database().ref(`allFiles/${uniqueKey}`).update({
            fileName: file[0].name,
            fileType: file[0].type,
            fileURL: downloadURL,
            id:generateTimestampId()
        })

    }

    useEffect(() => {
        setFileList([])
        const onChildAdded = database().ref(`allFiles`).on('child_added', (snapshot) => {
            setFileList((prevFiles) => [...prevFiles, snapshot.val()]);
        })
        return () => database().ref(`allFiles`).off('child_added', onChildAdded);
    }, [])
console.log('fileList',fileList)


const calculateUploadSpeed = (bytesTransferred, elapsedTime) => {
    if (elapsedTime === 0) {
      return '0 KB/s'; // Avoid division by zero
    }
    const kilobytes = bytesTransferred / 1024;
    const speed = kilobytes / elapsedTime;
    return speed.toFixed(1) + ' KB/s';
  };
 
    return (
        <View style={styles.container}>
            {uploading && (<>
               
          <ProgressBar progress={uploadProgress} />
          <Text style = {{color:'black'}}>{speed}</Text>
            </>
          
      
      )}
     
            <Button title="Pick a filegdgdg" onPress={pickDocument} />
            <FlatList
                data={fileList}
                keyExtractor={(item) => item.id}
                renderItem={({ item}) => (
                    <TouchableOpacity onPress={() => navigation.navigate('FilePreview',{
                        fileData: item,
                    })}>
                    <View  style={styles.fileItem}>
                        <Text style={{color:'black'}}>Filename: {item.fileName}</Text>
                        <Text style={{color:'black'}}>File Type: {item.fileType}</Text>
                        <Text style={{color:'black'}}>File URL: {item.fileURL}</Text>
                    </View>
                </TouchableOpacity> 
                    
                )}
                
            />
        </View>
    );
}
export default Uploading
const styles = StyleSheet.create({
    container: {
        marginVertical:20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileItem: {
        marginVertical: 8,
        padding: 8,
        backgroundColor: '#f9f9f9',
        borderRadius: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        
    },
    
});
