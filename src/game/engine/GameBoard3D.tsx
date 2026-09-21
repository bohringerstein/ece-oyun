import { useEffect, useMemo, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Board, Slot, Token } from "./buildBoard";
import { Card3D } from "./Card3D";
import { getTextTexture, getContainerTexture, getTexture } from "./textures";
import { popSound, wrongSound } from "../audio/sfx";
import { speakEncourage } from "../audio/speak";

interface Props {
  board: Board;
  onWin: () => void;
}

const PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

// 3D metin etiketi
function TextLabel({ text, color, y = 0, size = 0.5 }: { text: string; color?: string; y?: number; size?: number }) {
  const tex = useMemo(() => getTextTexture(text, color), [text, color]);
  return (
    <mesh position={[0, y, 0.05]}>
      <planeGeometry args={[size * 2, size]} />
      <meshBasicMaterial map={tex} transparent alphaTest={0.02} toneMapped={false} />
    </mesh>
  );
}

// Ustteki ornek sekli isaret eden animasyonlu parmak (sekiller bolumu).
// Yonerge calarken dikkat ceker: seklin altinda ziplar, ~4.5 sn sonra solar.
function PointerHand({ pos }: { pos: [number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const start = useRef(performance.now());
  const tex = useMemo(() => getTexture({ kind: "emoji", char: "👆" }), []);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const e = (performance.now() - start.current) / 1000;
    if (e > 4.5) {
      g.visible = false;
      return;
    }
    g.position.y = pos[1] + Math.abs(Math.sin(e * 4)) * 0.32; // sekle dogru zipla
    if (mat.current) mat.current.opacity = e > 3.8 ? Math.max(0, 1 - (e - 3.8) / 0.7) : 1;
  });
  return (
    <group ref={ref} position={[pos[0], pos[1], 0.5]} rotation={[0, 0, 0.32]}>
      <mesh>
        <planeGeometry args={[1.25, 1.25]} />
        <meshBasicMaterial ref={mat} map={tex} transparent alphaTest={0.02} toneMapped={false} />
      </mesh>
    </group>
  );
}

// Geniş dokulu hedef (sepet/masa)
function Container({ kind, w, h }: { kind: "basket" | "table"; w: number; h: number }) {
  const tex = useMemo(() => getContainerTexture(kind), [kind]);
  return (
    <mesh position={[0, 0, -0.05]}>
      <planeGeometry args={[w, h * 1.9]} />
      <meshBasicMaterial map={tex} transparent alphaTest={0.02} toneMapped={false} />
    </mesh>
  );
}

// Hedef görünümü (stile göre)
function SlotView({ slot }: { slot: Slot }) {
  const s = slot;
  if (s.style === "shadow") {
    // token ile aynı boyutta -> üstüne tam oturur
    return s.visual ? <Card3D content={s.visual} boxW={1.9} boxH={1.9} /> : null;
  }
  if (s.style === "target") {
    return (
      <group>
        <mesh position={[0, 0, -0.09]}>
          <circleGeometry args={[Math.min(s.w, s.h) * 0.58, 40]} />
          <meshBasicMaterial color="#c9e8ff" transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, 0, -0.08]}>
          <circleGeometry args={[Math.min(s.w, s.h) * 0.5, 40]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
        </mesh>
        {s.visual && <Card3D content={s.visual} boxW={s.w * 0.66} boxH={s.h * 0.66} />}
      </group>
    );
  }
  if (s.style === "hole") {
    return (
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[s.w * 0.82, s.h * 0.82]} />
        <meshBasicMaterial color="#ffe08a" transparent opacity={0.35} />
      </mesh>
    );
  }
  if (s.style === "cell") {
    // yapboz hucresi: ince cerceve + parcanin soluk onizlemesi (referans)
    return (
      <group>
        <mesh position={[0, 0, -0.04]}>
          <planeGeometry args={[s.w + 0.05, s.h + 0.05]} />
          <meshBasicMaterial color="#a9b6cf" transparent opacity={0.6} />
        </mesh>
        <mesh position={[0, 0, -0.03]}>
          <planeGeometry args={[s.w - 0.02, s.h - 0.02]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
        {s.visual && (
          <group position={[0, 0, -0.02]}>
            <Card3D content={s.visual} boxW={s.w - 0.02} boxH={s.h - 0.02} faint />
          </group>
        )}
      </group>
    );
  }
  if (s.style === "slot") {
    return (
      <group>
        <mesh position={[0, 0, -0.08]}>
          <planeGeometry args={[s.w, s.h]} />
          <meshBasicMaterial color="#ff9ec4" transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[s.w - 0.18, s.h - 0.18]} />
          <meshBasicMaterial color="#fff7fb" />
        </mesh>
        {s.label && <TextLabel text={s.label} color="#ff7aa8" y={s.h * 0.28} size={s.h * 0.34} />}
      </group>
    );
  }
  if (s.style === "bin") {
    // sıralama kutusu: renkli kutu + ust'te ikon + ALT BANT'ta etiket.
    // Etiket, koyu seffaf bir alt bandin ICINDE net durur; kutu disina TASMAZ
    // (eski surumde yazi alt kenara tasip yukarida kayik gorunuyordu).
    const bandY = -s.h / 2 + 0.42;
    return (
      <group>
        {/* renkli govde */}
        <mesh position={[0, -0.12, -0.1]}>
          <planeGeometry args={[s.w, s.h]} />
          <meshBasicMaterial color={s.color || "#d99a5b"} transparent opacity={0.95} />
        </mesh>
        {/* ikon icin beyaz alan (ust) */}
        <mesh position={[0, 0.35, -0.08]}>
          <planeGeometry args={[s.w - 0.25, s.h - 1.2]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>
        {s.visual && (
          <group position={[0, 0.45, 0]}>
            <Card3D content={s.visual} boxW={s.w * 0.42} boxH={0.95} />
          </group>
        )}
        {s.label && (
          <group>
            {/* etiket bandi (koyu seffaf) -> yazi cercevelenir, kontrast artar */}
            <mesh position={[0, bandY, -0.02]}>
              <planeGeometry args={[s.w, 0.72]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.18} />
            </mesh>
            <group position={[0, bandY, 0]}>
              <TextLabel text={s.label} color="#ffffff" size={0.42} />
            </group>
          </group>
        )}
      </group>
    );
  }
  // basket / table (geniş dokulu hedef)
  return <Container kind={s.style === "table" ? "table" : "basket"} w={s.w} h={s.h} />;
}

export function GameBoard3D({ board, onWin }: Props) {
  const { camera, gl } = useThree();
  const groupRefs = useRef<Map<string, THREE.Group>>(new Map());
  const slotRefs = useRef<Map<string, THREE.Group>>(new Map());
  const targets = useRef<Map<string, [number, number, number]>>(new Map());
  const pulse = useRef<Map<string, number>>(new Map());
  const dragId = useRef<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const placedRef = useRef(placed);
  placedRef.current = placed;
  const wonRef = useRef(false);
  const rootRef = useRef<THREE.Group>(null);
  const [boardStamp, setBoardStamp] = useState(0); // parmagi her turda yeniden baslatmak icin

  useEffect(() => {
    targets.current.clear();
    board.tokens.forEach((t) => targets.current.set(t.id, [t.home[0], t.home[1], 0]));
    setPlaced({});
    wonRef.current = false;
    setBoardStamp((s) => s + 1);
  }, [board]);

  // TEST kancası
  useEffect(() => {
    if (typeof window === "undefined" || !new URLSearchParams(window.location.search).has("test")) return;
    (window as any).__auto = () => {
      const root = rootRef.current;
      if (!root) return [];
      root.updateWorldMatrix(true, false);
      const rect = gl.domElement.getBoundingClientRect();
      const toScreen = (x: number, y: number) => {
        const v = new THREE.Vector3(x, y, 0.15);
        root.localToWorld(v);
        v.project(camera);
        return { x: rect.left + (v.x * 0.5 + 0.5) * rect.width, y: rect.top + (-v.y * 0.5 + 0.5) * rect.height };
      };
      const pairs: any[] = [];
      for (const t of board.tokens) {
        let slot: Slot | null = null;
        for (const sl of board.slots) {
          const ok = sl.expects ? t.tag === sl.expects : t.correct;
          if (ok) {
            slot = sl;
            break;
          }
        }
        if (slot) pairs.push({ from: toScreen(t.home[0], t.home[1]), to: toScreen(slot.pos[0], slot.pos[1]) });
      }
      return pairs;
    };
  }, [board]);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  function worldFromEvent(clientX: number, clientY: number): [number, number] {
    const rect = gl.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(ndc, camera);
    raycaster.ray.intersectPlane(PLANE, tmp);
    return [tmp.x, tmp.y];
  }

  function basketArrange(slotId: string): void {
    const slot = board.slots.find((s) => s.id === slotId)!;
    const ids = board.tokens.filter((t) => placedRef.current[t.id] === slotId).map((t) => t.id);
    const n = ids.length;
    // kabin grafiginin ust YUZEY cizgisi (dunya y): nesneler bunun ustune "otursun",
    // grafigin ortasina binmesin. Boylece masada/sepette 3B duruyormus gibi gorunur.
    const surface =
      slot.style === "table" ? slot.pos[1] + 0.95 :
      slot.style === "basket" ? slot.pos[1] + 1.15 :
      slot.style === "bin" ? slot.pos[1] + 0.55 :
      null;
    ids.forEach((id, i) => {
      const tok = board.tokens.find((t) => t.id === id)!;
      const x = n === 1 ? slot.pos[0] : slot.pos[0] - (slot.w / 2 - 1) + ((slot.w - 2) * i) / Math.max(1, n - 1);
      // nesnenin yaklasik yari yuksekligi (olcegine gore) -> tabani yuzeye otursun
      const half = 0.9 * (tok.scale ?? 1);
      const y = surface !== null ? surface + half : slot.pos[1] + 0.2;
      // artan z: ust uste binince z-fighting olmasin, sonra gelen ustte kalir
      targets.current.set(id, [x, y, 0.3 + i * 0.04]);
    });
  }

  function hitSlot(x: number, y: number, token: Token): Slot | null {
    const occupied = new Set(Object.values(placedRef.current));
    let best: Slot | null = null;
    let bestd = 1e9;
    for (const s of board.slots) {
      if (!s.basket && occupied.has(s.id)) continue;
      const dx = Math.abs(x - s.pos[0]);
      const dy = Math.abs(y - s.pos[1]);
      if (dx < s.w / 2 + 0.4 && dy < s.h / 2 + 0.6) {
        const ok = s.expects ? token.tag === s.expects : token.correct;
        if (ok) {
          const d = dx + dy;
          if (d < bestd) {
            bestd = d;
            best = s;
          }
        }
      }
    }
    return best;
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragId.current) return;
      const [x, y] = worldFromEvent(e.clientX, e.clientY);
      targets.current.set(dragId.current, [x, y, 1.2]);
    }
    function onUp(e: PointerEvent) {
      const id = dragId.current;
      if (!id) return;
      dragId.current = null;
      const token = board.tokens.find((t) => t.id === id)!;
      const [x, y] = worldFromEvent(e.clientX, e.clientY);
      const slot = hitSlot(x, y, token);
      if (slot) {
        const next = { ...placedRef.current, [id]: slot.id };
        setPlaced(next);
        placedRef.current = next;
        if (slot.basket) basketArrange(slot.id);
        // Token arka görselle AYNI DÜZLEME insin ki üstüne TAM otursun.
        // z=0.2 kalsaydi tabla egimi (-0.13 rad) + perspektif yuzunden merkez-disi
        // konumda (or. golge x=3.0, kenar yuva x=3.5) yukari-saga kayar, altindaki
        // gorseli tam kapatmazdi. Δz'yi kucultmek kaymayi ortadan kaldirir.
        //  - shadow/target/cell: arka gorselin (golge/hedef/yapboz onizleme) hemen onu
        //  - hole: statik seklin onunde kalmali
        //  - slot: "?" etiketini (dunya z=-0.05) hala kapatmali -> z=0'a kadar iner
        else {
          const st = slot.style;
          const z =
            st === "shadow" || st === "target" || st === "cell" ? -0.08 :
            st === "hole" ? 0.02 :
            st === "slot" ? 0.0 :
            0.2;
          targets.current.set(id, [slot.pos[0], slot.pos[1], z]);
        }
        pulse.current.set(slot.id, performance.now());
        popSound();
        const done = Object.keys(next).length;
        if (done >= board.win && !wonRef.current) {
          wonRef.current = true;
          setTimeout(onWin, 450);
        }
      } else {
        targets.current.set(id, [token.home[0], token.home[1], 0]);
        wrongSound();
        speakEncourage();
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [board]);

  useFrame((_, dt) => {
    const k = Math.min(1, dt * 12);
    const t = performance.now() / 1000;
    const now = performance.now();
    board.tokens.forEach((tok, idx) => {
      const g = groupRefs.current.get(tok.id);
      if (!g) return;
      const tg = targets.current.get(tok.id) || [tok.home[0], tok.home[1], 0];
      let ty = tg[1];
      if (dragId.current !== tok.id && !placedRef.current[tok.id]) ty += Math.sin(t * 2 + idx) * 0.06;
      g.position.x += (tg[0] - g.position.x) * k;
      g.position.y += (ty - g.position.y) * k;
      g.position.z += (tg[2] - g.position.z) * k;
      const baseScale = tok.scale ?? 1;
      const targetScale = dragId.current === tok.id ? baseScale * 1.18 : baseScale;
      g.scale.x += (targetScale - g.scale.x) * k;
      g.scale.y = g.scale.x;
      g.scale.z = g.scale.x;
    });
    // hedef pulse efekti
    slotRefs.current.forEach((g, id) => {
      const st = pulse.current.get(id);
      let sc = 1;
      if (st) {
        const e = (now - st) / 1000;
        if (e < 0.45) sc = 1 + 0.3 * Math.sin((e / 0.45) * Math.PI);
        else pulse.current.delete(id);
      }
      g.scale.x += (sc - g.scale.x) * Math.min(1, dt * 18);
      g.scale.y = g.scale.x;
    });
  });

  function startDrag(tok: Token, e: any) {
    if (placedRef.current[tok.id]) return;
    e.stopPropagation();
    dragId.current = tok.id;
    gl.domElement.setPointerCapture?.(e.pointerId);
  }

  return (
    <group ref={rootRef}>
      {board.statics.map((s, i) => (
        <group key={`st${i}`} position={[s.pos[0], s.pos[1], 0]}>
          <Card3D content={s.content} boxW={s.w} boxH={s.h} faint={s.faint} />
        </group>
      ))}

      {board.pointer && <PointerHand key={boardStamp} pos={board.pointer} />}

      {/* karsilastirma gruplarini cevreleyen esit kutular (tokenlarin arkasinda) */}
      {board.frames?.map((f, i) => (
        <group key={`fr${i}`} position={[f.pos[0], f.pos[1], -0.25]}>
          <mesh>
            <planeGeometry args={[f.w, f.h]} />
            <meshBasicMaterial color="#ffb84d" transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[f.w - 0.16, f.h - 0.16]} />
            <meshBasicMaterial color="#fffdf7" transparent opacity={0.92} />
          </mesh>
        </group>
      ))}

      {board.slots.map((s) => (
        <group
          key={s.id}
          position={[s.pos[0], s.pos[1], -0.1]}
          ref={(el) => {
            if (el) slotRefs.current.set(s.id, el);
          }}
        >
          <SlotView slot={s} />
        </group>
      ))}

      {board.tokens.map((tok) => (
        <group
          key={tok.id}
          ref={(el) => {
            if (el) groupRefs.current.set(tok.id, el);
          }}
          position={[tok.home[0], tok.home[1], 0]}
        >
          <Card3D content={tok.content} boxW={tok.w ?? 1.9} boxH={tok.h ?? 1.9} onPointerDown={(e: any) => startDrag(tok, e)} />
        </group>
      ))}
    </group>
  );
}
