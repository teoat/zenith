import React, { useRef, useEffect } from "react";
import * as THREE from "three";

interface GraphNode {
  id: string;
  group: string;
  label: string;
  val: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface ThreeDGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
}

const ThreeDGraph: React.FC<ThreeDGraphProps> = ({
  data,
  width = 800,
  height = 600,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x0a0a0a);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create nodes
    const nodeGeometry = new THREE.SphereGeometry(0.1, 16, 16);

    data.nodes.forEach((_, index) => {
      // Create new material for each node with different color
      const colors = [0x3b82f6, 0x10b981, 0xf59e0b, 0xef4444, 0x8b5cf6];
      const nodeMaterialColored = new THREE.MeshBasicMaterial({
        color: colors[index % colors.length],
      });

      const mesh = new THREE.Mesh(nodeGeometry, nodeMaterialColored);

      // Position nodes in a circle
      const angle = (index / data.nodes.length) * Math.PI * 2;
      const radius = 2;
      mesh.position.x = Math.cos(angle) * radius;
      mesh.position.y = Math.sin(angle) * radius;
      mesh.position.z =
        (window.crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff -
          0.5) *
        2;

      scene.add(mesh);
    });

    // Create links
    const linkMaterial = new THREE.LineBasicMaterial({
      color: 0x374151,
      opacity: 0.3,
      transparent: true,
    });
    const linkGeometry = new THREE.BufferGeometry();

    data.links.forEach((link) => {
      const sourceNode = data.nodes.find((n) => n.id === link.source);
      const targetNode = data.nodes.find((n) => n.id === link.target);

      if (sourceNode && targetNode) {
        const sourceIndex = data.nodes.indexOf(sourceNode);
        const targetIndex = data.nodes.indexOf(targetNode);

        const sourceAngle = (sourceIndex / data.nodes.length) * Math.PI * 2;
        const targetAngle = (targetIndex / data.nodes.length) * Math.PI * 2;
        const radius = 2;

        const points = [];
        points.push(
          new THREE.Vector3(
            Math.cos(sourceAngle) * radius,
            Math.sin(sourceAngle) * radius,
            (window.crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff -
              0.5) *
              2,
          ),
        );
        points.push(
          new THREE.Vector3(
            Math.cos(targetAngle) * radius,
            Math.sin(targetAngle) * radius,
            (window.crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff -
              0.5) *
              2,
          ),
        );

        linkGeometry.setFromPoints(points);
        const line = new THREE.Line(linkGeometry.clone(), linkMaterial);
        scene.add(line);
      }
    });

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (scene && camera && renderer) {
        scene.rotation.y += 0.005;
        renderer.render(scene, camera);
      }
    };

    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [data, width, height]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full bg-slate-900 rounded-lg border border-slate-700"
    />
  );
};

export default ThreeDGraph;
