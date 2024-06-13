import { Dimensions, StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import Pdf from 'react-native-pdf';
import { useTasks } from './FileuploadsContextProviders';


const FilePreview = () => {
    const tasksContext = useTasks();
    const [isLoading, setIsLoading] = useState(true);
    if (!tasksContext) {
        throw new Error('useTasks must be used within a TasksContextProvider');
    }

    const { selectedFile } = tasksContext;
    const firebaseURL = selectedFile?.fileURL;


    if (!selectedFile) {
        return <Text>No file selected</Text>;
    }
    return (
        <View style={{ flex: 1 }}>
            {isLoading && (
                <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />
            )}
            <Pdf
                trustAllCerts={false}
                source={{ uri: firebaseURL, cache: true }}
                style={{ flex: 1, width: Dimensions.get('window').width, height: Dimensions.get('window').height }}
                onLoadComplete={() => {
                    setIsLoading(false);
                }}
                onError={(err) => {
                    console.log(err,)
                }}
            />

        </View>
    )
}

export default FilePreview

const styles = StyleSheet.create({})