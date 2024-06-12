import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Uploading  from './FileUpload'

const Home = () => {
  return (
    <View>
       <Uploading image={undefined} progress={0}/>
    </View>
  )
}

export default Home

const styles = StyleSheet.create({})