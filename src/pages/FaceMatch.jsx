import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function FaceMatch() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [matchedUser, setMatchedUser] = useState(null);
  const [noMatch, setNoMatch] = useState(false);
  const matchIntervalRef = useRef(null);

  useEffect(() => {
    const loadModelsAndStart = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models/tiny_face_detector");
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models/face_landmark_68_tiny");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models/face_recognition");
      console.log("✅ Models loaded");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.autoplay = true;
          videoRef.current.playsInline = true;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("❌ Error accessing webcam:", err);
      }
    };

    loadModelsAndStart();
  }, []);

  useEffect(() => {
    const handlePlay = async () => {
      console.log("✅ Webcam video started");

      const displaySize = {
        width: videoRef.current.width,
        height: videoRef.current.height,
      };
      faceapi.matchDimensions(canvasRef.current, displaySize);

      const labeledDescriptors = await loadLabeledImages();
      if (labeledDescriptors.length === 0) {
        console.warn("⚠️ No known faces loaded.");
        return;
      }

      const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

      matchIntervalRef.current = setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true)
          .withFaceDescriptors();

        console.log("🧠 Detected faces:", detections);

        const resized = faceapi.resizeResults(detections, displaySize);
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        const results = resized.map(d => faceMatcher.findBestMatch(d.descriptor));

        if (results.length === 0) {
          setNoMatch(true);
          setMatchedUser(null);
        }

        results.forEach((result, i) => {
          const box = resized[i].detection.box;
          new faceapi.draw.DrawBox(box, { label: result.toString() }).draw(canvasRef.current);

          if (result.label !== "unknown") {
            if (!matchedUser) {
              console.log("🎯 First match found:", result.label);
              setMatchedUser(result.label);
              setNoMatch(false);
              clearInterval(matchIntervalRef.current);
            }
          } else {
            setNoMatch(true);
            setMatchedUser(null);
          }
        });
      }, 2000);
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener("play", handlePlay);
    }

    return () => {
      clearInterval(matchIntervalRef.current);
      if (video) {
        video.removeEventListener("play", handlePlay);
      }
    };
  }, [matchedUser]);

  const loadLabeledImages = async () => {
    const labels = ["user1", "user2", "user3", "user4"];
    return Promise.all(
      labels.map(async (label) => {
        try {
          const img = await faceapi.fetchImage(`/known_faces/${label}.jpeg`);
          const detection = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks(true)
            .withFaceDescriptor();

          if (!detection) {
            console.warn(`❌ No face found in image: ${label}.jpeg`);
            return null;
          }

          return new faceapi.LabeledFaceDescriptors(label, [detection.descriptor]);
        } catch (err) {
          console.error(`❌ Error loading image ${label}.jpeg`, err);
          return null;
        }
      })
    ).then(desc => desc.filter(Boolean));
  };

  const dummyUserData = {
    user1: { name: "Bebooo Love You", email: "john@example.com", id: "1" },
    user2: { name: "Deepak", email: "jane@example.com", id: "2" },
    user3: { name: "Sameer Seo specialist", email: "sameer@example.com", id: "3" },
    user4: { name: "Manager h kya", email: "manager@example.com", id: "4" },
  };

  return (
    <div className="container py-4 text-center">
      <h2 className="mb-3">Face Recognition System</h2>

      <div style={{ position: "relative", display: "inline-block" }}>
        <video ref={videoRef} width="320" height="240" className="border" />
        <canvas
          ref={canvasRef}
          width="320"
          height="240"
          style={{ position: "absolute", top: 0, left: 0 }}
        />
      </div>

      {matchedUser && dummyUserData[matchedUser] && (
        <div className="card mt-4 p-3 shadow">
          <h4 className="text-success">✅ Match Found</h4>
          <p><strong>Name:</strong> {dummyUserData[matchedUser].name}</p>
          <p><strong>Email:</strong> {dummyUserData[matchedUser].email}</p>
          <p><strong>User ID:</strong> {dummyUserData[matchedUser].id}</p>
        </div>
      )}

      {noMatch && (
        <div className="alert alert-warning mt-3">
          😕 No match found yet. Make sure your face is clearly visible and matches the known photos.
        </div>
      )}
    </div>
  );
}
