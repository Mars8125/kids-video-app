import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { HomeScreen } from './src/screens/HomeScreen'
import { VideoPlayerScreen } from './src/screens/VideoPlayerScreen'
import { Video } from './src/types'

export type RootStackParamList = {
  Home: undefined
  Player: { video: Video }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreenWrapper} />
        <Stack.Screen 
          name="Player" 
          component={VideoPlayerScreenWrapper}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

function HomeScreenWrapper({ navigation }: any) {
  return (
    <HomeScreen 
      onVideoPress={(video) => navigation.navigate('Player', { video })}
    />
  )
}

function VideoPlayerScreenWrapper({ route, navigation }: any) {
  const video = route.params?.video as Video
  return (
    <VideoPlayerScreen 
      video={video} 
      navigation={navigation}
    />
  )
}
