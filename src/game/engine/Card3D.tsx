import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Content } from "../data/types";
import { getTexture, imageAspect } from "./textures";

export function fitBox(content: Content, boxW: number, boxH: number): [number, number] {
  // yapboz resmi/parcasi kutuyu TAM doldurur (dokusu zaten o dikdortgene gore cizilir).
  // Aksi halde kare olmayan hucrelerde parca kareye sikisir ve aralarda bosluk kalir.
  if (content.kind === "piece" || content.kind === "picture") return [boxW, boxH];
  let aspect = 1;
  if (content.kind === "image") aspect = imageAspect(content.src) || 1;
  else if (content.kind === "shadow" && content.src) aspect = imageAspect(content.src) || 1;
  let w = boxW,
    h = boxH;
  if (aspect > boxW / boxH) {
    w = boxW;
    h = boxW / aspect;
  } else {
    h = boxH;
    w = boxH * aspect;
  }
  return [w, h];
}

interface Props {
  content: Content;
  boxW: number;
  boxH: number;
  faint?: boolean;
  onPointerDown?: (e: any) => void;
}

// Tek bir 3D kart: dokulu düzlem + arkasında yumuşak gölge
export function Card3D({ content, boxW, boxH, faint, onPointerDown }: Props) {
  const tex = useMemo(() => getTexture(content), [content]);
  const [w, h] = fitBox(content, boxW, boxH);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const isShadow = content.kind === "shadow";
  const isPuzzle = content.kind === "puzzle";
  return (
    <group onPointerDown={onPointerDown}>
      {/* siluet gölge: nesnenin şeklini alır - gölge/puzzle parçasında yok (tam otursun) */}
      {!faint && !isShadow && !isPuzzle && (
        <mesh position={[0.07, -0.08, -0.05]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={tex} color="#000" transparent opacity={0.18} alphaTest={0.05} depthWrite={false} />
        </mesh>
      )}
      {/* görsel (gölge ise siyaha boyanmış siluet) */}
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial
          ref={matRef}
          map={tex}
          color={isShadow ? "#2b2b2b" : "#ffffff"}
          transparent
          opacity={faint ? 0.45 : 1}
          alphaTest={0.05}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
