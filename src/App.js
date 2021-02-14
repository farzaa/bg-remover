import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import Webcam from "react-webcam";
import * as tf from '@tensorflow/tfjs';
import space from "./space.jpg"
import arctic from "./arctic.jpg"
import jungle from "./jungle.jpg"
import { image } from '@tensorflow/tfjs';
const bodyPix = require('@tensorflow-models/body-pix');

function App() {
  const backgrounds = [space, arctic, jungle]
  const webcamRef = React.useRef(null);
  const videoRef = React.useRef(null);
  const [currBg, setCurrBg] = useState(0)
  let curr = 0
  useEffect(() => {
    getVideo();
  }, [videoRef]);

  const getVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 300 } })
      .then(stream => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
      })
      .catch(err => {
        console.error("error:", err);
      });
  };


  useEffect(() => {
    setTimeout(async () => {
      let net = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2,
      })

      requestAnimationFrame(() => {
        drawVideo(net)
      })
    }, 2000);
  }, [])

  const drawVideo = async (net) => {
    let canvas = document.getElementById("canvas-working");
    let ctx = canvas.getContext('2d');

    const screen = webcamRef.current.getScreenshot();
    if (!screen) {
      console.log("no image!!")
      return
    }

    var webcamImage = new Image();
    webcamImage.onload = async function() {
      const segmentation = await net.segmentPerson(webcamImage, {
        flipHorizontal: false,
        internalResolution: 'medium',
        segmentationThreshold: 0.7
      });
      // console.log(segmentation)

      var spaceImage = new Image();
      let imgData
      spaceImage.src = backgrounds[curr]
      spaceImage.onload = function () {
        ctx.drawImage(spaceImage, 0, 0, 640, 360);
        imgData = ctx.getImageData(0,0, 640, 360);

        var i;
        for (var p = 0; p<imgData.data.length; p+=4)
        {
          if (segmentation.data[p/4] == 1) {
            imgData.data[p+3] = 0;
          }
        }
    
        ctx.putImageData(imgData, 0, 0);

        requestAnimationFrame(() => {
          drawVideo(net)
        })
      }
    };
    webcamImage.src = screen
  }

  const videoConstraints = {
    width: 640,
    height: 360,
    facingMode: "user"
  };

  const nextBg = () => {
    curr = (curr + 1) % 3
  }

  return (
    <>
      <Webcam
        id="webcam"
        audio={false}
        height={360}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={640}
        videoConstraints={videoConstraints}
      />
      <canvas id="canvas-working" height={360} width={640}/>
      <button id="nextBgButton" onClick={nextBg}>Next</button>
    </>
  );
}

export default App;
