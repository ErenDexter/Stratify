<script lang="ts">
	import FluidSimulation from '$lib/components/FluidSimulation.svelte';
	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import InfoPanel from '$lib/components/InfoPanel.svelte';
	import VelocityGraph from '$lib/components/VelocityGraph.svelte';

	let upperFlowRate = $state(0.5);
	let lowerFlowRate = $state(0.3);
	let upperViscosity = $state(1.0);
	let lowerViscosity = $state(2.0);
	let mobileMenuOpen = $state(false);

	function resetSimulation() {
		upperFlowRate = 0.5;
		lowerFlowRate = 0.3;
		upperViscosity = 1.0;
		lowerViscosity = 2.0;
	}
</script>

<svelte:head>
	<title>Stratify | Two-Phase Fluid Flow Simulation</title>
	<meta
		name="description"
		content="Interactive two-phase stratified flow simulation with realistic fluid mechanics"
	/>
</svelte:head>

<main class="relative w-full h-screen overflow-hidden bg-gray-950">
	<FluidSimulation bind:upperFlowRate bind:lowerFlowRate bind:upperViscosity bind:lowerViscosity />

	<ControlPanel bind:upperFlowRate bind:lowerFlowRate bind:upperViscosity bind:lowerViscosity />

	<InfoPanel {upperFlowRate} {lowerFlowRate} {upperViscosity} {lowerViscosity} />

	<div class="hidden md:block fixed top-6 left-6">
		<VelocityGraph {upperFlowRate} {lowerFlowRate} {upperViscosity} {lowerViscosity} />
	</div>
</main>
