import { Vector2, Vector3 } from 'three'

export const DepthMaskShader = {
  uniforms: {
    tSceneDepth: { value: null },
    tTargetDepth: { value: null },
    uSamplePos: { value: new Vector2() },
    uCameraNear: { value: 0.01 },
    uCameraFar: { value: 50 },
    uIsPerspectiveCamera: { value: 1 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
  fragmentShader: /* glsl */ `
    #include <packing>

    varying vec2 vUv;
    uniform vec2 uSamplePos;
    uniform sampler2D tSceneDepth;
    uniform sampler2D tTargetDepth;
    uniform float uCameraNear;
    uniform float uCameraFar;
    uniform int uIsPerspectiveCamera;

    float readDepth( sampler2D depthSampler, vec2 coord ) {
      if(uIsPerspectiveCamera == 1) {
        float fragCoordZ = texture2D(depthSampler, coord).x;
        float viewZ = perspectiveDepthToViewZ(fragCoordZ, uCameraNear, uCameraFar);
        return viewZToOrthographicDepth(viewZ, uCameraNear, uCameraFar);
      } else {
        return texture2D(depthSampler, coord).x;
      }
    }

    void main() {
        float depth = readDepth( tSceneDepth, vUv );
        float pointDepth = readDepth( tTargetDepth, uSamplePos );

        float mask = step(pointDepth, depth);
        mask = clamp(mask, 0., 1.);

        gl_FragColor.rgb = vec3(mask);
        gl_FragColor.a = mask;
    }
    `
}
