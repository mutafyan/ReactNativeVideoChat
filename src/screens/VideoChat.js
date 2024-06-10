import React, {useState, useEffect, useRef} from 'react';
import {View, StyleSheet, Button} from 'react-native';
import {
  mediaDevices,
  RTCView,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaStream,
} from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';

const VideoChat = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(new MediaStream());
  const [wsReady, setWsReady] = useState(false);
  const peerConnection = useRef(null);
  const ws = useRef(null);
  const token = 'YOUR_JWT_TOKEN';
  const recipientUserId = 'RECIPIENT USER ID';
  const userId = 'YOUR ID'; // Replace this with the actual user ID
  const host = 'YOUR HOST';

  useEffect(() => {
    const initialize = async () => {
      await startLocalStream();
      setupWebSocket();
      // Start the InCallManager
      InCallManager.start({media: 'audio'});
      InCallManager.setSpeakerphoneOn(true); // Route audio to loudspeaker
    };

    initialize();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (ws.current) {
        ws.current.close();
      }
      // Stop the InCallManager
      InCallManager.stop();
    };
  }, []);

  useEffect(() => {
    if (localStream && wsReady) {
      setupPeerConnection();
    }
  }, [localStream, wsReady]);

  const startLocalStream = async () => {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {facingMode: 'user'},
      });
      setLocalStream(stream);
      console.log('Local stream started', stream.toURL());
    } catch (error) {
      console.error('Failed to get local stream:', error);
    }
  };

  const setupWebSocket = () => {
    const serverUrl = `ws://${host}/chat/${recipientUserId}?token=${token}`;
    ws.current = new WebSocket(serverUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
      setWsReady(true);
    };

    ws.current.onmessage = async e => {
      const data = JSON.parse(e.data);
      if (data.type === 'offer') {
        console.log('OFFER ', data.offer);
        await handleOffer(data);
      } else if (data.type === 'answer') {
        await handleAnswer(data);
      } else if (data.type === 'candidate') {
        await handleCandidate(data);
      }
    };

    ws.current.onerror = error => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
      setWsReady(false);
    };
  };

  const setupPeerConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302', // insert your stun/turn server if needed
          //   username: 'your username',
          //   credential: 'your credential',
        },
      ],
    });

    peerConnection.current.onicecandidate = event => {
      if (event.candidate) {
        console.log('Sending ICE candidate:', event.candidate);
        ws.current.send(
          JSON.stringify({
            type: 'candidate',
            candidate: event.candidate,
            from: userId,
          }),
        );
      }
    };

    peerConnection.current.ontrack = event => {
      console.log('Received remote track:', event.track);
      setRemoteStream(prevStream => {
        const updatedStream = new MediaStream(prevStream);
        updatedStream.addTrack(event.track);
        return updatedStream;
      });
    };

    // Add local stream tracks to the peer connection
    localStream.getTracks().forEach(track => {
      peerConnection.current.addTrack(track, localStream);
    });

    // On negotiation needed (if required)
    peerConnection.current.onnegotiationneeded = async () => {
      try {
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        ws.current.send(
          JSON.stringify({
            type: 'offer',
            offer,
            from: userId,
          }),
        );
      } catch (error) {
        console.error('Error during negotiation:', error);
      }
    };
  };

  const createOffer = async () => {
    if (!peerConnection.current) {
      console.error('Peer connection not established');
      return;
    }

    if (peerConnection.current.signalingState !== 'stable') {
      console.error(
        `Cannot create offer in signaling state: ${peerConnection.current.signalingState}`,
      );
      return;
    }

    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      ws.current.send(
        JSON.stringify({
          type: 'offer',
          offer,
          from: userId,
        }),
      );
    } catch (error) {
      console.error('Failed to create offer:', error);
    }
  };

  const handleOffer = async data => {
    const offer = data.offer;
    console.log('DATA:::', data);
    if (data.from === userId) {
      return;
    }
    if (!peerConnection.current) {
      console.error('Peer connection not established');
      return;
    }

    try {
      const sessionDesc = new RTCSessionDescription(offer);
      await peerConnection.current.setRemoteDescription(sessionDesc);
      console.log(peerConnection.current.signalingState);

      if (peerConnection.current.signalingState === 'have-remote-offer') {
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        ws.current.send(
          JSON.stringify({
            type: 'answer',
            answer,
            from: userId,
          }),
        );
      } else {
        console.warn(
          `Unexpected signaling state: ${peerConnection.current.signalingState}`,
        );
      }
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  };

  const handleAnswer = async data => {
    const answer = data.answer;
    console.log('ANSWER:::', answer);
    if (data.from === userId) {
      return;
    }
    if (!peerConnection.current) {
      console.error('Peer connection not established');
      return;
    }

    try {
      const remoteDesc = new RTCSessionDescription(answer);
      if (peerConnection.current.signalingState === 'have-local-offer') {
        await peerConnection.current.setRemoteDescription(remoteDesc);
        console.log('Remote description set successfully');
      } else {
        console.warn(
          `Unexpected signaling state: ${peerConnection.current.signalingState}`,
        );
      }
    } catch (error) {
      console.error('Failed to handle answer:', error);
    }
  };

  const handleCandidate = async data => {
    const candidate = data.candidate;
    if (data.from === userId) {
      return;
    }
    if (!peerConnection.current) {
      console.error('Peer connection not established');
      return;
    }

    try {
      const iceCandidate = new RTCIceCandidate(candidate);
      await peerConnection.current.addIceCandidate(iceCandidate);
      console.log('ICE candidate added:', iceCandidate);
    } catch (error) {
      console.error('Failed to handle candidate:', error);
    }
  };

  const stopLocalStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      console.log('Local stream stopped');
    }
  };

  return (
    <View style={styles.container}>
      {localStream && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.stream}
          mirror={true}
        />
      )}
      {remoteStream && remoteStream.toURL() && (
        <RTCView streamURL={remoteStream.toURL()} style={styles.stream} />
      )}
      <View style={styles.buttons}>
        <Button title="Start Video" onPress={startLocalStream} />
        <Button title="Create Offer" onPress={createOffer} />
        <Button title="Stop Video" onPress={stopLocalStream} />
      </View>
    </View>
  );
};

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

export default VideoChat;
