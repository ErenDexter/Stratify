<script lang="ts">
	import FluidSimulation from '$lib/components/FluidSimulation.svelte';
	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import InfoPanel from '$lib/components/InfoPanel.svelte';

	let upperFlowRate = $state(0.5);
	let lowerFlowRate = $state(0.3);
	let upperViscosity = $state(1.0);
	let lowerViscosity = $state(2.0);
</script>

<svelte:head>
	<title>FlowFusion - Two-Fluid Flow Simulation</title>
	<meta name="description" content="Interactive two-phase fluid flow simulation using Three.js" />
</svelte:head>

<main class="relative w-full h-screen overflow-hidden bg-gray-950">
	<FluidSimulation bind:upperFlowRate bind:lowerFlowRate bind:upperViscosity bind:lowerViscosity />

	<ControlPanel bind:upperFlowRate bind:lowerFlowRate bind:upperViscosity bind:lowerViscosity />

	<InfoPanel />
</main>
