import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PatientRecord } from '../../types';
import { CSISpatialState } from './CSIAdapter';

interface DigitalTwinHumanProps {
  patient: PatientRecord;
  csiState: CSISpatialState;
  showDebugSkeleton?: boolean;
  showRespirationWave?: boolean;
  quality?: 'high' | 'balanced' | 'performance';
}

export const DigitalTwinHuman: React.FC<DigitalTwinHumanProps> = ({
  patient,
  csiState,
  showDebugSkeleton = false,
  quality = 'high',
}) => {
  const rootGroupRef = useRef<THREE.Group>(null);
  const thoraxRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const spineRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  // Status color for clinical indicators
  const statusColor = useMemo(() => {
    if (patient.status === 'critical') return '#ef4444';
    if (patient.status === 'warning') return '#f59e0b';
    if (patient.status === 'responding') return '#38bdf8';
    return '#10b981';
  }, [patient.status]);

  // Realistic PBR Skin Material
  const skinMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#dfba94'),
      roughness: 0.58,
      metalness: 0.02,
      bumpScale: 0.002,
    });
  }, []);

  // Subtle darker skin contour / shade for anatomical depth
  const skinShadowMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ce9e72'),
      roughness: 0.62,
      metalness: 0.01,
    });
  }, []);

  // Hair material (Soft natural dark tone with specular sheen)
  const hairMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#231c18'),
      roughness: 0.45,
      metalness: 0.1,
    });
  }, []);

  // Realistic Eye Sclera & Iris Material
  const eyeScleraMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f8fafc'),
      roughness: 0.1,
      metalness: 0.05,
    });
  }, []);

  const eyeIrisMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2563eb'),
      roughness: 0.2,
      metalness: 0.1,
    });
  }, []);

  // Hospital Telemetry Scrubs Material (Believable fabric roughness & folds)
  const scrubsFabricMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1e293b'), // Deep slate navy medical fabric
      roughness: 0.88,
      metalness: 0.04,
    });
  }, []);

  const scrubsTrimMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0f766e'), // Cyan/teal clinical trim
      roughness: 0.82,
      metalness: 0.05,
    });
  }, []);

  // Clinical Holographic Skeletal Debug Material
  const skeletonDebugMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color('#38bdf8'),
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
  }, []);

  // Target Joint Configurations based on anatomical posture
  const postureTargets = useMemo(() => {
    switch (patient.posture) {
      case 'bed':
        return {
          pos: [csiState.coordinates.x, csiState.coordinates.y, csiState.coordinates.z] as [number, number, number],
          rot: [-Math.PI / 2 + 0.1, 0, 0] as [number, number, number],
          headRot: [-0.1, 0, 0] as [number, number, number],
          leftArmRot: [0.08, 0, 0.22] as [number, number, number],
          rightArmRot: [0.08, 0, -0.22] as [number, number, number],
          leftLegRot: [0.08, 0, 0.04] as [number, number, number],
          rightLegRot: [0.08, 0, -0.04] as [number, number, number],
          leftKneeBend: 0.12,
          rightKneeBend: 0.12,
        };

      case 'sitting':
        return {
          pos: [csiState.coordinates.x, csiState.coordinates.y, csiState.coordinates.z] as [number, number, number],
          rot: [0, Math.PI / 2, 0] as [number, number, number],
          headRot: [0.05, -0.1, 0] as [number, number, number],
          leftArmRot: [0.65, 0, 0.15] as [number, number, number],
          rightArmRot: [0.65, 0, -0.15] as [number, number, number],
          leftLegRot: [1.45, 0, 0.08] as [number, number, number],
          rightLegRot: [1.45, 0, -0.08] as [number, number, number],
          leftKneeBend: -1.5,
          rightKneeBend: -1.5,
        };

      case 'standing':
        return {
          pos: [csiState.coordinates.x, csiState.coordinates.y, csiState.coordinates.z] as [number, number, number],
          rot: [0, -Math.PI / 4, 0] as [number, number, number],
          headRot: [0, 0.1, 0] as [number, number, number],
          leftArmRot: [0.05, 0, 0.12] as [number, number, number],
          rightArmRot: [0.05, 0, -0.12] as [number, number, number],
          leftLegRot: [0.02, 0, 0.05] as [number, number, number],
          rightLegRot: [0.02, 0, -0.05] as [number, number, number],
          leftKneeBend: 0.02,
          rightKneeBend: 0.02,
        };

      case 'fallen':
      default:
        return {
          pos: [csiState.coordinates.x, csiState.coordinates.y, csiState.coordinates.z] as [number, number, number],
          rot: [0.2, Math.PI / 3, Math.PI / 2.05] as [number, number, number],
          headRot: [-0.25, 0.3, 0] as [number, number, number],
          leftArmRot: [0.8, 0.2, 0.4] as [number, number, number],
          rightArmRot: [-0.4, 0.1, -0.6] as [number, number, number],
          leftLegRot: [0.75, 0, 0.3] as [number, number, number],
          rightLegRot: [0.4, 0, -0.2] as [number, number, number],
          leftKneeBend: -0.9,
          rightKneeBend: -0.6,
        };
    }
  }, [patient.posture, csiState.coordinates]);

  // Real-time animation loop (Thoracic Respiration & Smooth Kinematic Interpolation)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const lerpSpeed = 0.075;

    // Smooth root position & orientation interpolation
    if (rootGroupRef.current) {
      rootGroupRef.current.position.x = THREE.MathUtils.lerp(rootGroupRef.current.position.x, postureTargets.pos[0], lerpSpeed);
      rootGroupRef.current.position.y = THREE.MathUtils.lerp(rootGroupRef.current.position.y, postureTargets.pos[1], lerpSpeed);
      rootGroupRef.current.position.z = THREE.MathUtils.lerp(rootGroupRef.current.position.z, postureTargets.pos[2], lerpSpeed);

      rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(rootGroupRef.current.rotation.x, postureTargets.rot[0], lerpSpeed);
      rootGroupRef.current.rotation.y = THREE.MathUtils.lerp(rootGroupRef.current.rotation.y, postureTargets.rot[1], lerpSpeed);
      rootGroupRef.current.rotation.z = THREE.MathUtils.lerp(rootGroupRef.current.rotation.z, postureTargets.rot[2], lerpSpeed);
    }

    // Realistic Thoracic Respiration Kinematics
    if (thoraxRef.current) {
      const respWave = Math.sin(csiState.respirationPhase);
      const thoracicExpansion = 1 + respWave * 0.024; // Subtle, anatomically accurate chest rise
      const anteroposteriorExpansion = 1 + respWave * 0.038;
      thoraxRef.current.scale.set(thoracicExpansion, 1, anteroposteriorExpansion);
    }

    // Subtle natural head micro-motion
    if (headRef.current) {
      const microSway = Math.sin(t * 0.8) * 0.012;
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, postureTargets.headRot[0] + microSway, lerpSpeed);
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, postureTargets.headRot[1], lerpSpeed);
      headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, postureTargets.headRot[2], lerpSpeed);
    }

    // Arm joint interpolation
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, postureTargets.leftArmRot[0], lerpSpeed);
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, postureTargets.leftArmRot[2], lerpSpeed);

      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, postureTargets.rightArmRot[0], lerpSpeed);
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, postureTargets.rightArmRot[2], lerpSpeed);
    }

    // Leg joint interpolation
    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, postureTargets.leftLegRot[0], lerpSpeed);
      leftLegRef.current.rotation.z = THREE.MathUtils.lerp(leftLegRef.current.rotation.z, postureTargets.leftLegRot[2], lerpSpeed);

      rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, postureTargets.rightLegRot[0], lerpSpeed);
      rightLegRef.current.rotation.z = THREE.MathUtils.lerp(rightLegRef.current.rotation.z, postureTargets.rightLegRot[2], lerpSpeed);
    }
  });

  return (
    <group ref={rootGroupRef}>
      {/* ========================================================= */}
      {/* 1. HEAD & FACIAL ANATOMICAL STRUCTURE */}
      {/* ========================================================= */}
      <group ref={headRef} position={[0, 0.74, 0]}>
        {/* Cranium / Skull Vault */}
        <mesh position={[0, 0.05, -0.015]} castShadow receiveShadow>
          <sphereGeometry args={[0.112, 32, 28]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>

        {/* Anatomical Hair Mesh */}
        <mesh position={[0, 0.075, -0.02]} rotation={[-0.15, 0, 0]}>
          <sphereGeometry args={[0.116, 24, 20]} />
          <primitive object={hairMaterial} attach="material" />
        </mesh>

        {/* Face / Jaw Structure */}
        <mesh position={[0, -0.01, 0.025]} rotation={[0.18, 0, 0]} castShadow>
          <boxGeometry args={[0.108, 0.095, 0.102]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>

        {/* Chin / Mandible */}
        <mesh position={[0, -0.065, 0.045]} castShadow>
          <sphereGeometry args={[0.034, 16, 16]} />
          <primitive object={skinShadowMaterial} attach="material" />
        </mesh>

        {/* Realistic Nose */}
        <mesh position={[0, 0.012, 0.118]} rotation={[0.1, 0, 0]} castShadow>
          <coneGeometry args={[0.018, 0.046, 12]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>

        {/* Left Eye & Cornea */}
        <group position={[-0.038, 0.038, 0.098]}>
          <mesh>
            <sphereGeometry args={[0.014, 16, 16]} />
            <primitive object={eyeScleraMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <sphereGeometry args={[0.007, 12, 12]} />
            <primitive object={eyeIrisMaterial} attach="material" />
          </mesh>
        </group>

        {/* Right Eye & Cornea */}
        <group position={[0.038, 0.038, 0.098]}>
          <mesh>
            <sphereGeometry args={[0.014, 16, 16]} />
            <primitive object={eyeScleraMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <sphereGeometry args={[0.007, 12, 12]} />
            <primitive object={eyeIrisMaterial} attach="material" />
          </mesh>
        </group>

        {/* Ears */}
        <mesh position={[-0.115, 0.025, 0]} rotation={[0, 0, -0.15]}>
          <capsuleGeometry args={[0.014, 0.032, 8, 12]} />
          <primitive object={skinShadowMaterial} attach="material" />
        </mesh>
        <mesh position={[0.115, 0.025, 0]} rotation={[0, 0, 0.15]}>
          <capsuleGeometry args={[0.014, 0.032, 8, 12]} />
          <primitive object={skinShadowMaterial} attach="material" />
        </mesh>

        {/* Anatomical Neck & Clavicle Root */}
        <mesh position={[0, -0.115, 0]} castShadow>
          <cylinderGeometry args={[0.052, 0.068, 0.11, 24]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 2. THORACIC CAVITY, PECTORALS & RESPIRATION CORE */}
      {/* ========================================================= */}
      <group ref={spineRef} position={[0, 0.46, 0]}>
        {/* Thoracic Ribcage (Dynamic Respiration Scaling) */}
        <group ref={thoraxRef}>
          {/* Main Upper Torso */}
          <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.172, 0.148, 0.32, 28]} />
            <primitive object={skinMaterial} attach="material" />
          </mesh>

          {/* Left Pectoral Muscle Contour */}
          <mesh position={[-0.082, 0.12, 0.082]} rotation={[0.08, -0.12, 0]} castShadow>
            <boxGeometry args={[0.13, 0.105, 0.045]} />
            <primitive object={skinMaterial} attach="material" />
          </mesh>

          {/* Right Pectoral Muscle Contour */}
          <mesh position={[0.082, 0.12, 0.082]} rotation={[0.08, 0.12, 0]} castShadow>
            <boxGeometry args={[0.13, 0.105, 0.045]} />
            <primitive object={skinMaterial} attach="material" />
          </mesh>

          {/* Clavicles & Trapezius Ridge */}
          <mesh position={[0, 0.19, 0.02]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.038, 0.28, 12, 16]} />
            <primitive object={skinShadowMaterial} attach="material" />
          </mesh>
        </group>

        {/* Abdomen / Lumbar Spine */}
        <mesh position={[0, -0.15, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.145, 0.155, 0.18, 24]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>

        {/* Pelvis & Clinical Scrub Shorts */}
        <group position={[0, -0.28, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.16, 0.155, 0.18, 24]} />
            <primitive object={scrubsFabricMaterial} attach="material" />
          </mesh>
          {/* Clinical Waistband Trim */}
          <mesh position={[0, 0.085, 0]}>
            <cylinderGeometry args={[0.162, 0.162, 0.025, 24]} />
            <primitive object={scrubsTrimMaterial} attach="material" />
          </mesh>
        </group>
      </group>

      {/* ========================================================= */}
      {/* 3. ARTICULATED UPPER EXTREMITIES (SHOULDERS, ARMS, HANDS) */}
      {/* ========================================================= */}
      {/* LEFT ARM */}
      <group ref={leftArmRef} position={[-0.22, 0.58, 0]}>
        {/* Left Deltoid */}
        <mesh castShadow>
          <sphereGeometry args={[0.058, 16, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Left Bicep / Brachium */}
        <mesh position={[-0.03, -0.12, 0]} rotation={[0, 0, 0.12]} castShadow>
          <cylinderGeometry args={[0.046, 0.039, 0.22, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Left Elbow Joint */}
        <mesh position={[-0.052, -0.24, 0]}>
          <sphereGeometry args={[0.038, 12, 12]} />
          <primitive object={skinShadowMaterial} attach="material" />
        </mesh>
        {/* Left Forearm / Antebrachium */}
        <mesh position={[-0.065, -0.36, 0.02]} rotation={[0.15, 0, 0.1]} castShadow>
          <cylinderGeometry args={[0.038, 0.032, 0.21, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Left Hand with 5 Distinct Digits */}
        <group position={[-0.08, -0.49, 0.04]}>
          {/* Palm */}
          <mesh castShadow>
            <boxGeometry args={[0.045, 0.065, 0.022]} />
            <primitive object={skinMaterial} attach="material" />
          </mesh>
          {/* Thumb */}
          <mesh position={[0.024, 0.012, 0.012]} rotation={[0, -0.3, -0.4]}>
            <capsuleGeometry args={[0.007, 0.028, 6, 8]} />
            <primitive object={skinMaterial} attach="material" />
          </mesh>
          {/* 4 Fingers */}
          {[-0.015, -0.005, 0.005, 0.015].map((xOffset, idx) => (
            <mesh key={idx} position={[xOffset, -0.042, 0]}>
              <capsuleGeometry args={[0.0055, 0.032, 6, 8]} />
              <primitive object={skinMaterial} attach="material" />
            </mesh>
          ))}
        </group>
      </group>

      {/* RIGHT ARM */}
      <group ref={rightArmRef} position={[0.22, 0.58, 0]}>
        {/* Right Deltoid */}
        <mesh castShadow>
          <sphereGeometry args={[0.058, 16, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Right Bicep / Brachium */}
        <mesh position={[0.03, -0.12, 0]} rotation={[0, 0, -0.12]} castShadow>
          <cylinderGeometry args={[0.046, 0.039, 0.22, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Right Elbow Joint */}
        <mesh position={[0.052, -0.24, 0]}>
          <sphereGeometry args={[0.038, 12, 12]} />
          <primitive object={skinShadowMaterial} attach="material" />
        </mesh>
        {/* Right Forearm / Antebrachium */}
        <mesh position={[0.065, -0.36, 0.02]} rotation={[0.15, 0, -0.1]} castShadow>
          <cylinderGeometry args={[0.038, 0.032, 0.21, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Right Hand with 5 Distinct Digits */}
        <group position={[0.08, -0.49, 0.04]}>
          {/* Palm */}
          <mesh castShadow>
            <boxGeometry args={[0.045, 0.065, 0.022]} />
            <primitive object={skinMaterial} attach="material" />
          </mesh>
          {/* Thumb */}
          <mesh position={[-0.024, 0.012, 0.012]} rotation={[0, 0.3, 0.4]}>
            <capsuleGeometry args={[0.007, 0.028, 6, 8]} />
            <primitive object={skinMaterial} attach="material" />
          </mesh>
          {/* 4 Fingers */}
          {[-0.015, -0.005, 0.005, 0.015].map((xOffset, idx) => (
            <mesh key={idx} position={[xOffset, -0.042, 0]}>
              <capsuleGeometry args={[0.0055, 0.032, 6, 8]} />
              <primitive object={skinMaterial} attach="material" />
            </mesh>
          ))}
        </group>
      </group>

      {/* ========================================================= */}
      {/* 4. LOWER EXTREMITIES (THIGHS, KNEES, CALVES, FEET) */}
      {/* ========================================================= */}
      {/* LEFT LEG */}
      <group ref={leftLegRef} position={[-0.1, 0.16, 0]}>
        {/* Left Thigh & Scrub Leg */}
        <mesh position={[0, -0.14, 0]} castShadow>
          <cylinderGeometry args={[0.068, 0.054, 0.28, 20]} />
          <primitive object={scrubsFabricMaterial} attach="material" />
        </mesh>
        {/* Left Knee Joint */}
        <mesh position={[0, -0.3, 0.01]}>
          <sphereGeometry args={[0.049, 16, 16]} />
          <primitive object={skinShadowMaterial} attach="material" />
        </mesh>
        {/* Left Calf / Lower Leg */}
        <mesh position={[0, -0.46, 0]} castShadow>
          <cylinderGeometry args={[0.052, 0.039, 0.28, 18]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Left Foot with Heel & Metatarsal Arch */}
        <group position={[0, -0.62, 0.05]}>
          <mesh castShadow>
            <boxGeometry args={[0.068, 0.042, 0.16]} />
            <primitive object={skinMaterial} attach="material" />
          </mesh>
        </group>
      </group>

      {/* RIGHT LEG */}
      <group ref={rightLegRef} position={[0.1, 0.16, 0]}>
        {/* Right Thigh & Scrub Leg */}
        <mesh position={[0, -0.14, 0]} castShadow>
          <cylinderGeometry args={[0.068, 0.054, 0.28, 20]} />
          <primitive object={scrubsFabricMaterial} attach="material" />
        </mesh>
        {/* Right Knee Joint */}
        <mesh position={[0, -0.3, 0.01]}>
          <sphereGeometry args={[0.049, 16, 16]} />
          <primitive object={skinShadowMaterial} attach="material" />
        </mesh>
        {/* Right Calf / Lower Leg */}
        <mesh position={[0, -0.46, 0]} castShadow>
          <cylinderGeometry args={[0.052, 0.039, 0.28, 18]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Right Foot with Heel & Metatarsal Arch */}
        <group position={[0, -0.62, 0.05]}>
          <mesh castShadow>
            <boxGeometry args={[0.068, 0.042, 0.16]} />
            <primitive object={skinMaterial} attach="material" />
          </mesh>
        </group>
      </group>

      {/* ========================================================= */}
      {/* 5. SCIENTIFIC CLINICAL SENSING GROUND BEACON */}
      {/* ========================================================= */}
      <group position={[0, -0.49, 0]}>
        {/* Outer Pulsing Spatial Presence Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.44, 36]} />
          <meshBasicMaterial color={statusColor} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        {/* Inner Doppler Micro-Shift Track */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.25, 32]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Optional Debug Skeleton Wireframe Overlay */}
      {showDebugSkeleton && (
        <group position={[0, 0.35, 0]}>
          <mesh>
            <capsuleGeometry args={[0.18, 0.75, 12, 16]} />
            <primitive object={skeletonDebugMaterial} attach="material" />
          </mesh>
        </group>
      )}
    </group>
  );
};
