<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { FluidEngine } from '../simulation/FluidEngine';
	import type { SimulationConfig } from '../types/simulation.types';

	let {
		upperFlowRate = $bindable(0.5),
		lowerFlowRate = $bindable(0.3),
		upperViscosity = $bindable(1.0),
		lowerViscosity = $bindable(2.0)
	} = $props();

	let container: HTMLDivElement;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let controls: OrbitControls;
	let fluidEngine: FluidEngine;
	let animationId: number;

	const config: SimulationConfig = {
		particleCount: 8000,
		pipeLength: 10,
		pipeRadius: 1,
		upperFluid: {
			flowRate: upperFlowRate,
			viscosity: upperViscosity,
			density: 800,
			color: 0x4da6ff
		},
		lowerFluid: {
			flowRate: lowerFlowRate,
			viscosity: lowerViscosity,
			density: 1000,
			color: 0xff8c42
		}
	};

	onMount(() => {
		if (browser) {
			initScene();
			createPipe();
			initFluidSimulation();
			animate();
		}

		return () => {
			cleanup();
		};
	});

	function initScene(): void {
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x0a0a0a);

		camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
		camera.position.set(5, 3, 5);

		renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: false,
			depth: true,
			stencil: false
		});
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.sortObjects = true;
		container.appendChild(renderer.domElement);

		controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(10, 10, 10);
		scene.add(directionalLight);

		const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
		gridHelper.position.y = -1.5;
		scene.add(gridHelper);

		window.addEventListener('resize', onWindowResize);
	}

	function createPipe(): void {
		const pipeLength = config.pipeLength;
		const pipeRadius = config.pipeRadius;

		const pipeGeometry = new THREE.CylinderGeometry(
			pipeRadius,
			pipeRadius,
			pipeLength,
			32,
			1,
			true
		);

		const pipeMaterial = new THREE.MeshPhongMaterial({
			color: 0x888888,
			transparent: true,
			opacity: 0.2,
			side: THREE.DoubleSide,
			emissive: 0x222222,
			depthWrite: true,
			depthTest: true
		});

		const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
		pipe.rotation.z = Math.PI / 2;
		pipe.renderOrder = 0;
		scene.add(pipe);

		const capGeometry = new THREE.CircleGeometry(pipeRadius, 32);
		const capMaterial = new THREE.MeshBasicMaterial({
			color: 0x444444,
			side: THREE.DoubleSide
		});

		const leftCap = new THREE.Mesh(capGeometry, capMaterial);
		leftCap.position.x = -pipeLength / 2;
		leftCap.rotation.y = Math.PI / 2;
		scene.add(leftCap);

		const rightCap = new THREE.Mesh(capGeometry, capMaterial);
		rightCap.position.x = pipeLength / 2;
		rightCap.rotation.y = -Math.PI / 2;
		scene.add(rightCap);

		const interfaceGeometry = new THREE.PlaneGeometry(pipeLength, pipeRadius * 2);
		const interfaceMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.05,
			side: THREE.DoubleSide
		});

		const interfacePlane = new THREE.Mesh(interfaceGeometry, interfaceMaterial);
		interfacePlane.rotation.y = Math.PI / 2;
		scene.add(interfacePlane);
	}

	function initFluidSimulation(): void {
		fluidEngine = new FluidEngine(scene, config);
		fluidEngine.initialize();
	}

	let lastTime = Date.now();

	function animate(): void {
		animationId = requestAnimationFrame(animate);

		const currentTime = Date.now();
		const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
		lastTime = currentTime;

		fluidEngine.updateFluidParameters('upper', {
			flowRate: upperFlowRate,
			viscosity: upperViscosity
		});

		fluidEngine.updateFluidParameters('lower', {
			flowRate: lowerFlowRate,
			viscosity: lowerViscosity
		});

		fluidEngine.update(deltaTime, currentTime * 0.001);
		controls.update();
		renderer.render(scene, camera);
	}

	function onWindowResize(): void {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	function cleanup(): void {
		if (animationId) {
			cancelAnimationFrame(animationId);
		}
		fluidEngine?.dispose();
		renderer?.dispose();
		window.removeEventListener('resize', onWindowResize);
	}
</script>

<div bind:this={container} class="w-full h-screen"></div>
