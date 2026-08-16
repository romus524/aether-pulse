import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WireframeRoom3DProps {
  mousePos: { x: number; y: number };
}

export const WireframeRoom3D: React.FC<WireframeRoom3DProps> = ({ mousePos }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 160;
    const height = mount.clientHeight || 120;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(10, 8, 11);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    // Subtle, clean line materials matching prompt
    const cyanLineMat = new THREE.LineBasicMaterial({
      color: 0x49e8ff,
      transparent: true,
      opacity: 0.8,
    });

    const violetLineMat = new THREE.LineBasicMaterial({
      color: 0x9b5cff,
      transparent: true,
      opacity: 0.55,
    });

    // Floor Grid
    const floorSize = 5.5;
    const divisions = 6;
    const gridHelper = new THREE.GridHelper(floorSize, divisions, 0x49e8ff, 0x1b0d42);
    gridHelper.position.y = -1.0;
    roomGroup.add(gridHelper);

    // Architectural Wireframe Suite
    const outerWallGeo = new THREE.BoxGeometry(5.2, 1.8, 4.2);
    const outerEdges = new THREE.EdgesGeometry(outerWallGeo);
    const outerWallLines = new THREE.LineSegments(outerEdges, cyanLineMat);
    outerWallLines.position.y = -0.1;
    roomGroup.add(outerWallLines);

    // Interior Partition
    const partitionGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.6, -1.0, -2.1),
      new THREE.Vector3(-0.6, -1.0, 0.6),
      new THREE.Vector3(-0.6, 0.8, 0.6),
      new THREE.Vector3(-0.6, 0.8, -2.1),
      new THREE.Vector3(-0.6, -1.0, -2.1),
    ]);
    const partition = new THREE.Line(partitionGeo, violetLineMat);
    roomGroup.add(partition);

    // Bed Model Wireframe
    const bedGeo = new THREE.BoxGeometry(1.3, 0.45, 2.0);
    const bedEdges = new THREE.EdgesGeometry(bedGeo);
    const bedLines = new THREE.LineSegments(bedEdges, cyanLineMat);
    bedLines.position.set(1.1, -0.75, -0.4);
    roomGroup.add(bedLines);

    // Patient Kinetic Signal Nodes
    const voxelCount = 20;
    const voxelPositions = new Float32Array(voxelCount * 3);
    for (let v = 0; v < voxelCount; v++) {
      voxelPositions[v * 3] = 1.1 + (Math.random() - 0.5) * 0.7;
      voxelPositions[v * 3 + 1] = -0.38 + (Math.random() - 0.5) * 0.25;
      voxelPositions[v * 3 + 2] = -0.4 + (Math.random() - 0.5) * 1.3;
    }
    const voxelGeo = new THREE.BufferGeometry();
    voxelGeo.setAttribute('position', new THREE.BufferAttribute(voxelPositions, 3));
    const voxelMat = new THREE.PointsMaterial({
      color: 0xd84cff,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
    });
    const voxelCloud = new THREE.Points(voxelGeo, voxelMat);
    roomGroup.add(voxelCloud);

    let animId: number;
    let baseRotationY = -Math.PI / 4.5;
    const baseRotationX = Math.PI / 9;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = performance.now() * 0.001;

      // Slow orbital drift
      baseRotationY += 0.0025;

      // Subtle mouse reaction
      const targetRotX = baseRotationX + mousePos.y * 0.15;
      const targetRotY = baseRotationY + mousePos.x * 0.2;

      roomGroup.rotation.x += (targetRotX - roomGroup.rotation.x) * 0.06;
      roomGroup.rotation.y += (targetRotY - roomGroup.rotation.y) * 0.06;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      scene.clear();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full min-w-[130px] min-h-[95px] flex items-center justify-center pointer-events-none"
    />
  );
};
