import * as THREE from 'three'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { DepthMaskShader } from './shaders/DepthMaskShader'

const isPerspectiveCamera = (camera: THREE.Camera): camera is THREE.PerspectiveCamera => {
  return (camera as THREE.PerspectiveCamera).isPerspectiveCamera
}

export class DepthMask {
  sceneDepthBuffer: THREE.WebGLRenderTarget
  targetDepthBuffer: THREE.WebGLRenderTarget
  maskBuffer: THREE.WebGLRenderTarget

  targetObject: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  targetScene: THREE.Scene

  maskQuad: FullScreenQuad
  outputQuad: FullScreenQuad

  maskMaterial: THREE.ShaderMaterial
  outputMaterial: THREE.MeshBasicMaterial

  point: THREE.Vector3
  width: number
  height: number

  _setCameraUniforms: boolean = false
  _projected: THREE.Vector3 = new THREE.Vector3()
  _currentMaterial: 'mask' | 'output' = 'output'

  constructor(height: number, width: number, position = new THREE.Vector3()) {
    this.width = width
    this.height = height
    this.point = position

    // Setup buffers
    this.sceneDepthBuffer = new THREE.WebGLRenderTarget(height, width, {
      depthTexture: new THREE.DepthTexture(height, width),
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      stencilBuffer: false
    })

    this.targetDepthBuffer = this.sceneDepthBuffer.clone()
    this.targetDepthBuffer.depthTexture = new THREE.DepthTexture(height, width)

    this.maskBuffer = new THREE.WebGLRenderTarget(height, width, {
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      stencilBuffer: false
    })

    // Setup materials
    this.maskMaterial = new THREE.ShaderMaterial({
      uniforms: DepthMaskShader.uniforms,
      vertexShader: DepthMaskShader.vertexShader,
      fragmentShader: DepthMaskShader.fragmentShader
    })
    this.outputMaterial = new THREE.MeshBasicMaterial({ transparent: true })

    // Set up quad
    this.maskQuad = new FullScreenQuad(this.maskMaterial)
    this.outputQuad = new FullScreenQuad(this.outputMaterial)

    // Setup target scene
    this.targetScene = new THREE.Scene()
    const tempGeo = new THREE.PlaneGeometry(100, 100, 1, 1)
    this.targetObject = new THREE.Mesh(tempGeo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))
    this.targetObject.position.copy(this.point)
    this.targetScene.add(this.targetObject)
  }

  setPoint(point: THREE.Vector3) {
    this.point.copy(point)
    this.targetObject.position.copy(this.point)
  }

  getMaskAsTexture() {
    return this.maskBuffer.texture
  }

  getMaskAsImage(renderer: THREE.WebGLRenderer) {
    this.outputMaterial.map = this.getMaskAsTexture()
    this.outputQuad.render(renderer)
    return renderer.domElement.toDataURL()
  }

  update(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    if (!this._setCameraUniforms) {
      if (isPerspectiveCamera(camera)) {
        this.maskMaterial.uniforms.uCameraNear.value = camera.near
        this.maskMaterial.uniforms.uCameraFar.value = camera.far
        this.maskMaterial.uniforms.uIsPerspectiveCamera.value = 1
      } else {
        this.maskMaterial.uniforms.uIsPerspectiveCamera.value = 0
      }
      this._setCameraUniforms = true
    }

    this.targetObject.rotation.y = Math.atan2(camera.position.x - this.targetObject.position.x, camera.position.z - this.targetObject.position.z)

    // Render scene depth
    renderer.setRenderTarget(this.sceneDepthBuffer)
    renderer.render(scene, camera)

    // Render target depth
    renderer.setRenderTarget(this.targetDepthBuffer)
    renderer.render(this.targetScene, camera)

    // Process depth passes to create mask
    this.maskMaterial.uniforms.tSceneDepth.value = this.sceneDepthBuffer.depthTexture
    this.maskMaterial.uniforms.tTargetDepth.value = this.targetDepthBuffer.depthTexture

    // Get sample point for target depth buffer in screen space
    this._projected.copy(this.point).project(camera)
    this._projected.x = THREE.MathUtils.mapLinear(this._projected.x, -1, 1, 0, 1)
    this._projected.y = THREE.MathUtils.mapLinear(this._projected.y, -1, 1, 0, 1)

    this.maskMaterial.uniforms.uSamplePos.value.set(this._projected.x, this._projected.y)

    // Render final mask
    renderer.setRenderTarget(this.maskBuffer)
    this.maskQuad.render(renderer)
    renderer.setRenderTarget(null)
  }

  destroy() {
    this.sceneDepthBuffer.dispose()
    this.targetDepthBuffer.dispose()
    this.maskBuffer.dispose()

    this.maskMaterial.dispose()
    this.outputMaterial.dispose()

    this.maskQuad.dispose()
    this.outputQuad.dispose()

    this.targetObject.geometry.dispose()
    this.targetObject.material.dispose()

    this.targetScene.remove(this.targetObject)
  }
}
