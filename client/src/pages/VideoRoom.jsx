import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Sparkles,
  Users,
} from 'lucide-react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const VideoRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnected, setPeerConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const screenTrackRef = useRef(null);

  useEffect(() => {
    let localMediaStream;

    const startMedia = async () => {
      try {
        localMediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(localMediaStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localMediaStream;
        }

        // Initialize PeerConnection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // Add local tracks to peer connection
        localMediaStream.getTracks().forEach((track) => {
          pc.addTrack(track, localMediaStream);
        });

        // Handle remote stream
        pc.ontrack = (event) => {
          const [stream] = event.streams;
          setRemoteStream(stream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
          setPeerConnected(true);
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && socket) {
            socket.emit('webrtc:ice-candidate', {
              to: roomId,
              candidate: event.candidate,
              from: user._id,
            });
          }
        };

        // Socket listeners
        if (socket) {
          socket.emit('chat:join', roomId);

          socket.on('webrtc:offer', async ({ offer, from }) => {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc:answer', { to: from, answer, from: user._id });
            setPeerConnected(true);
          });

          socket.on('webrtc:answer', async ({ answer }) => {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            setPeerConnected(true);
          });

          socket.on('webrtc:ice-candidate', async ({ candidate }) => {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error('Error adding ICE candidate', e);
            }
          });

          socket.on('webrtc:end', () => {
            setPeerConnected(false);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            toast('Peer left the video session');
          });

          // Create offer if caller
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc:offer', { to: roomId, offer, from: user._id });
        }
      } catch (err) {
        console.error('Failed to get media devices:', err);
        toast.error('Unable to access camera or microphone.');
      }
    };

    startMedia();

    return () => {
      if (localMediaStream) {
        localMediaStream.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socket) {
        socket.emit('webrtc:end', { to: roomId });
        socket.emit('chat:leave', roomId);
      }
    };
  }, [roomId, socket, user._id]);

  const toggleMic = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicEnabled(audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraEnabled(videoTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === 'video');

        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error starting screen share:', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
    }
    const originalVideoTrack = localStream?.getVideoTracks()[0];
    const sender = peerConnectionRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === 'video');

    if (sender && originalVideoTrack) {
      sender.replaceTrack(originalVideoTrack);
    }

    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    setIsScreenSharing(false);
  };

  const handleEndCall = () => {
    if (socket) socket.emit('webrtc:end', { to: roomId });
    navigate('/calendar');
  };

  return (
    <>
      <Helmet>
        <title>Live Video Session | Connect Skill</title>
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-white flex flex-col pt-20 pb-6 px-4">
        {/* Room Header */}
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between py-3 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="font-extrabold text-base tracking-tight">
              Live WebRTC Peer Session
            </h2>
            <span className="text-xs text-slate-400 font-mono">Room: {roomId}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>{peerConnected ? '2 Participants Connected' : 'Waiting for Peer to Join...'}</span>
          </div>
        </div>

        {/* Video Grid */}
        <div className="max-w-6xl mx-auto w-full flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Local Video */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl h-[340px] md:h-[480px] flex items-center justify-center">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
            {!cameraEnabled && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center space-y-2">
                <VideoOff className="w-10 h-10 text-slate-500" />
                <span className="text-xs text-slate-400">Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white border border-slate-700/60">
              You ({user?.name})
            </div>
          </div>

          {/* Remote Video */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl h-[340px] md:h-[480px] flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!peerConnected && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center space-y-3 p-6 text-center">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500/40 border-t-emerald-500 animate-spin" />
                <h4 className="font-bold text-sm">Awaiting Peer Connection...</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Share this room or wait for your session peer to open the link. In-browser signaling is active.
                </p>
              </div>
            )}
            {peerConnected && (
              <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 border border-slate-700/60 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Peer Connected</span>
              </div>
            )}
          </div>
        </div>

        {/* Video Control Bar (Floating pill) */}
        <div className="flex justify-center mt-6">
          <div className="rounded-pill bg-slate-900/90 border border-slate-800 shadow-2xl px-6 py-3 flex items-center space-x-4 backdrop-blur-xl">
            <button
              onClick={toggleMic}
              className={`p-3.5 rounded-full transition-colors ${
                micEnabled
                  ? 'bg-slate-800 text-white hover:bg-slate-700'
                  : 'bg-rose-500 text-white hover:bg-rose-600'
              }`}
              title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
            >
              {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleCamera}
              className={`p-3.5 rounded-full transition-colors ${
                cameraEnabled
                  ? 'bg-slate-800 text-white hover:bg-slate-700'
                  : 'bg-rose-500 text-white hover:bg-rose-600'
              }`}
              title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-3.5 rounded-full transition-colors ${
                isScreenSharing
                  ? 'bg-brand-500 text-white hover:bg-brand-600'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            >
              <Monitor className="w-5 h-5" />
            </button>

            <button
              onClick={handleEndCall}
              className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              title="Leave Call"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default VideoRoom;
