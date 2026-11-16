import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function SoccerBall3D() {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 450;
    const height = container.clientHeight || 450;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // 2. Bright, Clean Studio Lighting (Ultra Red Clean White Theme)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Main Studio Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    // Subtle Hijau Muda Rim Light
    const rimLight = new THREE.DirectionalLight(0x10B981, 1.2);
    rimLight.position.set(-6, -2, -3);
    scene.add(rimLight);

    // Fill Light
    const fillLight = new THREE.DirectionalLight(0xE2E8F0, 1.0);
    fillLight.position.set(0, -5, 4);
    scene.add(fillLight);

    // 3. Soccer Ball Texture Generator (Clean White Leather with Hijau Muda Accents)
    const createSoccerTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Base Crisp White Leather
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Hexagonal / Pentagon grid pattern
      const hexRadius = 42;
      const hexHeight = hexRadius * Math.sqrt(3);
      
      for (let y = 0; y < canvas.height + hexHeight; y += hexHeight) {
        for (let x = 0; x < canvas.width + hexRadius * 3; x += hexRadius * 3) {
          drawHex(ctx, x, y, hexRadius);
          drawHex(ctx, x + hexRadius * 1.5, y + hexHeight / 2, hexRadius);
        }
      }

      function drawHex(c, cx, cy, r) {
        c.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = cx + r * Math.cos(angle);
          const hy = cy + r * Math.sin(angle);
          if (i === 0) c.moveTo(hx, hy);
          else c.lineTo(hx, hy);
        }
        c.closePath();

        const isPentagon = (Math.sin(cx * 0.05) + Math.cos(cy * 0.05)) > 0.65;
        if (isPentagon) {
          // Hijau Muda / Emerald Pattern Panels (Replacing Pink of Ultra Red)
          c.fillStyle = '#10B981';
          c.fill();
          c.strokeStyle = '#059669';
          c.lineWidth = 2.5;
          c.stroke();
        } else {
          // Crisp White Leather with subtle gray stitch
          c.fillStyle = '#F8FAFC';
          c.fill();
          c.strokeStyle = '#CBD5E1';
          c.lineWidth = 1.5;
          c.stroke();
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      return texture;
    };

    const ballTexture = createSoccerTexture();

    // 4. Soccer Ball Mesh
    const ballGeometry = new THREE.SphereGeometry(1.65, 64, 64);
    const ballMaterial = new THREE.MeshStandardMaterial({
      map: ballTexture,
      roughness: 0.3,
      metalness: 0.1,
    });
    const soccerBall = new THREE.Mesh(ballGeometry, ballMaterial);
    scene.add(soccerBall);

    // 5. Subtle Orbital Gyro Ring (Clean Hijau Muda Accents)
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    // Primary Ring
    const ringGeo1 = new THREE.RingGeometry(2.18, 2.20, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x10B981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2.6;
    ringGroup.add(ring1);

    // Secondary Ring
    const ringGeo2 = new THREE.RingGeometry(2.35, 2.36, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x64748B,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI / 3.4;
    ring2.rotation.y = Math.PI / 5;
    ringGroup.add(ring2);

    // 6. Soft Studio Shadow on Ground
    const shadowGeo = new THREE.CircleGeometry(1.6, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.07,
    });
    const groundShadow = new THREE.Mesh(shadowGeo, shadowMat);
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.y = -2.15;
    scene.add(groundShadow);

    // Mouse Interaction Variables
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let isUserInteracting = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      
      mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((clientY - rect.top) / rect.height) * 2 - 1);

      if (isUserInteracting) {
        const deltaX = clientX - previousMousePosition.x;
        const deltaY = clientY - previousMousePosition.y;
        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;
        previousMousePosition = { x: clientX, y: clientY };
      }
    };

    const handlePointerDown = (e) => {
      isUserInteracting = true;
      setIsDragging(true);
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      previousMousePosition = { x: clientX, y: clientY };
    };

    const handlePointerUp = () => {
      isUserInteracting = false;
      setIsDragging(false);
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);
    container.addEventListener('touchmove', handlePointerMove, { passive: true });
    container.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 7. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Continuous subtle spin
      if (!isUserInteracting) {
        targetRotationY += 0.006;
        targetRotationX = Math.sin(clock.getElapsedTime() * 0.4) * 0.12;
      }

      // Smooth damping
      soccerBall.rotation.y += (targetRotationY - soccerBall.rotation.y) * 0.08;
      soccerBall.rotation.x += (targetRotationX - soccerBall.rotation.x) * 0.08;

      // Parallax mouse tilt
      soccerBall.position.x += (mouseX * 0.3 - soccerBall.position.x) * 0.05;
      soccerBall.position.y += (mouseY * 0.3 - soccerBall.position.y) * 0.05;

      // Subtle rings rotation
      ring1.rotation.z += 0.003;
      ring2.rotation.z -= 0.004;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      container.removeEventListener('touchmove', handlePointerMove);
      container.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchend', handlePointerUp);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      className="relative w-full h-[380px] sm:h-[460px] lg:h-[500px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full relative z-10" />

      {/* Ultra Red Clean SaaS Telemetry Chips (Clean White Card with Hijau Muda Accents) */}
      
      {/* Top Right Chip */}
      <div className="absolute top-4 right-2 sm:right-6 z-20 pointer-events-none">
        <div className="bg-white/95 border border-slate-200/90 shadow-md backdrop-blur-md px-4 py-2.5 rounded-2xl flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <div>
            <div className="text-[10px] font-mono tracking-wider text-emerald-700 font-bold uppercase">
              RUMPUT SINTETIS
            </div>
            <div className="text-xs font-bold text-slate-800">
              Fasilitas Olahraga Polinela
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Left Chip */}
      <div className="absolute bottom-6 left-2 sm:left-6 z-20 pointer-events-none">
        <div className="bg-white/95 border border-slate-200/90 shadow-md backdrop-blur-md px-4 py-2.5 rounded-2xl flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          <div>
            <div className="text-[10px] font-mono tracking-wider text-emerald-700 font-bold uppercase">
              HOLD ENGINE: 05:00
            </div>
            <div className="text-xs font-bold text-slate-800">
              Anti Double-Booking Aktif
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Right Interactive Hint */}
      <div className="absolute bottom-6 right-2 sm:right-6 z-20 pointer-events-none hidden sm:block">
        <span className="text-[11px] font-mono tracking-wider px-3.5 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 shadow-xs">
          {isDragging ? '⚡ Memutar Objek 3D' : '🖱️ Drag untuk Putar Bola 3D'}
        </span>
      </div>

      {/* Very subtle soft ambient glow behind the ball */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full bg-emerald-100/40 blur-3xl"></div>
      </div>
    </div>
  );
}
