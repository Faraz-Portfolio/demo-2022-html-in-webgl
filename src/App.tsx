// @ts-ignore
import suzanne from "@gsimone/suzanne";
import {
  AccumulativeShadows,
  Environment,
  OrbitControls,
  RandomizedLight,
  useGLTF,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { FlakesTexture } from "three-stdlib";
import { Html } from "./lib/Html";

export default function App() {
  return (
    <Canvas shadows camera={{ position: [8, 1.5, 8], fov: 25 }}>
      <Suzi />
      <AccumulativeShadows
        temporal
        frames={100}
        color="orange"
        colorBlend={2}
        toneMapped={true}
        alphaTest={0.23}
        opacity={1}
        scale={12}
        position={[0, -0.5, 0]}
      >
        <RandomizedLight
          amount={8}
          radius={4}
          ambient={0.5}
          intensity={1}
          position={[5, 5, -10]}
          bias={0.001}
        />
      </AccumulativeShadows>
      <mesh castShadow position={[-2, -0.245, 1]}>
        <sphereGeometry args={[0.25, 64, 64]} />
        <meshStandardMaterial color="lightblue" />
      </mesh>
      <mesh
        castShadow
        position={[2.5, -0.24, 1]}
        rotation={[0, Math.PI / 4, 0]}
      >
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="indianred" />
      </mesh>
      <OrbitControls autoRotate={false} />
      <Environment preset="city" />

      <Html center transform depthTest position={[0, 1.5, -3]}>
        <iframe
          width="285"
          height="162.5"
          src="https://www.youtube.com/embed/dQw4w9WgXcQ"
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </Html>

      <axesHelper />
    </Canvas>
  );
}

function Suzi(props: any) {
  const { nodes } = useGLTF(suzanne) as any;

  return (
    <group {...props} rotation-y={-Math.PI / 4}>
      <mesh
        receiveShadow
        castShadow
        rotation={[THREE.MathUtils.degToRad(-35), 0, 0]}
        geometry={nodes.Suzanne.geometry}
      >
        <meshPhysicalMaterial
          color="orange"
          roughness={0}
          normalMap={
            new THREE.CanvasTexture(
              new FlakesTexture() as any,
              THREE.UVMapping,
              THREE.RepeatWrapping,
              THREE.RepeatWrapping
            ) as any
          }
          normalMap-repeat={[40, 40]}
          normalScale={[0.05, 0.05] as any}
        />
      </mesh>
    </group>
  );
}
