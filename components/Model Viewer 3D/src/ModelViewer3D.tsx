import { Suspense } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { CameraControls, Grid, Stage } from '@react-three/drei'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { Retool } from '@tryretool/custom-component-support'

export const ModelViewer3D = () => {
  const [modelUrl] = Retool.useStateString({
    name: 'modelUrl',
    label: 'Model URL',
    description: 'URL to an OBJ file. Please add CORS headers to Retool Storage URLs due to CORS restrictions.',
    initialValue: 'https://cors-anywhere.herokuapp.com/https://raw.githubusercontent.com/spdegabrielle/teapot/refs/heads/master/teapot.obj'
  })

  const [showGrid] = Retool.useStateBoolean({
    name: 'showGrid',
    label: 'Show Grid',
    initialValue: false
  })

  Retool.useComponentSettings({
    defaultWidth: 6,
    defaultHeight: 40,
  })

  const obj = useLoader(OBJLoader, modelUrl)

  return (
    <Canvas
      camera={{ position: [5, 5, 5] }}
    >
      <Suspense fallback={null}>
        <Stage adjustCamera>
          <primitive object={obj} />
          <CameraControls
            minDistance={1}
            maxDistance={100}
          />
          {showGrid && (
            <Grid
              infiniteGrid
              fadeDistance={50}
              fadeStrength={5}
              fadeFrom={0}
              sectionColor="lightgrey"
              cellColor="grey"
            />
          )}
        </Stage>
      </Suspense>
    </Canvas>
  )
}
