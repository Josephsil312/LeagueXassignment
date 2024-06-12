import { Dimensions, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Pdf from 'react-native-pdf';


const FilePreview = ({ route }) => {

    const firebaseURL = route.params.fileData.fileURL; // Assuming URL points to Firebase Storage

    return (
        <View style={{ flex: 1 }}>
            <Pdf
                trustAllCerts={false}
                source={{ uri: firebaseURL, cache: true }}
                style={{ flex: 1, width: Dimensions.get('window').width, height: Dimensions.get('window').height }}
                onLoadComplete={(numberOfPages, filePath) => {
                    console.log(`number of pages:${numberOfPages}`)
                }}
                onError={(err) => {
                    console.log(err)
                }}
            />

        </View>
    )
}

export default FilePreview

const styles = StyleSheet.create({})