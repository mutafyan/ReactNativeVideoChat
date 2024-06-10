
# React Native Video Chat App

## Overview

This project is a React Native application that provides a video chat functionality using the WebRTC protocol. The app allows users to initiate and receive video calls over a peer-to-peer connection. It uses a WebSocket server for signaling between peers and manages audio and video streams locally on the device.

## Features

- **Real-time Video Communication**: Establishes a peer-to-peer connection for video calls.
- **WebSocket Signaling**: Uses WebSocket for signaling between peers to manage the WebRTC connection.
- **In-Call Management**: Manages audio routes and call states during a video chat.
- **Start/Stop Local Stream**: Allows users to start and stop their local video stream.
- **Offer/Answer Mechanism**: Handles WebRTC offer/answer exchange for connection setup.
- **ICE Candidate Handling**: Manages ICE candidates for establishing the best possible connection path.

## Prerequisites

Before you start, ensure you have the following installed:

- Node.js (version 18 or higher)
- React Native CLI
- Android Studio and/or Xcode (for iOS development)
- A WebSocket server for signaling (details to be replaced with your server setup)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/react-native-video-chat.git
cd react-native-video-chat
```

### 2. Install Dependencies

```bash
yarn add
```

### 3. Configure Environment Variables

Replace the placeholder values in `VideoChat.js` with your actual credentials:

```javascript
const token = 'YOUR_JWT_TOKEN';          // Replace with your JWT token
const recipientUserId = 'RECIPIENT USER ID'; // Replace with the recipient user ID
const userId = 'YOUR ID';                // Replace with your actual user ID
const host = 'YOUR HOST';                // Replace with your WebSocket server host
```

### 4. Run the Application

To run the app on an Android or iOS device/emulator:

```bash
npx react-native run-android  // For Android
npx react-native run-ios      // For iOS
```

## Project Structure

- `App.js`: The entry point of the application which renders the `VideoChat` component.
- `src/screens/VideoChat.js`: The main component handling the video chat functionality, including local and remote stream management and WebRTC connection setup.

### `App.js`

```javascript
import React from 'react';
import VideoChat from './src/screens/VideoChat';

const App = () => {
  return <VideoChat />;
};

export default App;
```

### `VideoChat.js`

The `VideoChat.js` component is responsible for setting up and managing the video chat. It handles:

- **Local Stream Initialization**: Acquiring the local media stream using `getUserMedia`.
- **WebSocket Connection**: Establishing a WebSocket connection for signaling.
- **Peer Connection Setup**: Setting up the `RTCPeerConnection` for WebRTC communication.
- **Offer/Answer Handling**: Managing the offer/answer exchange to establish the connection.
- **ICE Candidate Handling**: Adding ICE candidates to facilitate the connection.
- **Stream Management**: Displaying the local and remote streams using `RTCView`.

### Main Functions

- **startLocalStream**: Initializes the local video stream.
- **setupWebSocket**: Establishes and manages the WebSocket connection.
- **setupPeerConnection**: Sets up the WebRTC peer connection and handles the media tracks.
- **createOffer**: Creates an offer to start the WebRTC connection.
- **handleOffer**: Handles the received offer and sends an answer.
- **handleAnswer**: Processes the received answer.
- **handleCandidate**: Adds received ICE candidates to the connection.
- **stopLocalStream**: Stops the local video stream.

### Example Usage

The app can be used to start a local video stream and create an offer for a video call. Buttons are provided to control these actions:

- **Start Video**: Initializes the local stream.
- **Create Offer**: Creates an offer to connect with another peer.
- **Stop Video**: Stops the local video stream.

### Styling

Basic styles are applied to position and size the video streams and buttons within the app:

```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  stream: {
    width: '100%',
    height: '40%',
    backgroundColor: 'gray',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
});
```

## Dependencies

- **react-native-webrtc**: Provides WebRTC support in React Native.
- **react-native-incall-manager**: Manages audio routing and call states during an active call.

## Troubleshooting

If you encounter any issues, consider the following:

- Ensure your WebSocket server is running and accessible.
- Verify that the STUN/TURN servers are correctly configured.
- Check for permission issues related to accessing the camera and microphone.


## Contributing

Contributions are welcome! Please open an issue or submit a pull request with your improvements.
