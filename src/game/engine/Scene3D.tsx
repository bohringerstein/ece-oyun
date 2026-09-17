import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { ReactNode } from "react";

const FOV = 48;
// Tahta icerigi kabaca x ∈ [-4.8, 4.8], y ∈ [-6, 6] arasinda.
const H_NEED = 6.9; // dikeyde gorunmesi gereken yari-yukseklik (mevcut masaustu kadraji)
const W_NEED = 5.4; // yatayda gorunmesi gereken yari-genislik (en genis tahta + pay)

// Kamerayi, tahtanin tamami her ekran oraninda kadraja sigacak sekilde uzaklastir.
// Genis ekranlarda dikey belirleyicidir; kadraj eskisi gibi kalir. Dar/dikey
// telefonlarda yatay belirleyici olur ve kamera geri cekilir -> kenardaki
// kartlarin kesilmesi biter. Surukleme raycaster ile guncel kamerayi baz
// aldigindan dokunma isabeti otomatik dogru kalir.
function CameraFit() {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  useEffect(() => {
    const aspect = width / Math.max(1, height);
    const halfV = Math.tan((FOV * Math.PI) / 360); // tan(fov/2)
    const dist = Math.max(H_NEED, W_NEED / aspect) / halfV;
    camera.position.set(0, 0, dist);
    camera.updateProjectionMatrix();
  }, [camera, width, height]);
  return null;
}

// Ortak 3D sahne: perspektif kamera, isik, hafif egik tabla
export function Scene3D({ children }: { children: ReactNode }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 15.5], fov: FOV }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "none" }}
    >
      <CameraFit />
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 8]} intensity={0.5} />
      <group rotation={[-0.13, 0, 0]}>{children}</group>
    </Canvas>
  );
}
