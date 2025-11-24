<script lang="ts">
	import FluidSimulation from '$lib/components/FluidSimulation.svelte';
	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import InfoPanel from '$lib/components/InfoPanel.svelte';

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
	<title>Stratify - Two-Phase Fluid Flow Simulation</title>
	<meta
		name="description"
		content="Interactive two-phase stratified flow simulation with realistic fluid mechanics"
	/>
</svelte:head>

<main class="relative w-full h-screen overflow-hidden bg-gray-950">
	<FluidSimulation bind:upperFlowRate bind:lowerFlowRate bind:upperViscosity bind:lowerViscosity />

	<ControlPanel bind:upperFlowRate bind:lowerFlowRate bind:upperViscosity bind:lowerViscosity />

	<InfoPanel />

	<!-- Mobile Control Button -->
	<button
		onclick={() => (mobileMenuOpen = true)}
		class="md:hidden fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl z-50 transition-colors"
		aria-label="Open controls"
	>
		<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
			/>
		</svg>
	</button>

	<!-- Mobile Drawer -->
	{#if mobileMenuOpen}
		<!-- Backdrop -->
		<div
			class="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
			role="button"
			tabindex="0"
			onclick={() => (mobileMenuOpen = false)}
			onkeydown={(e) => e.key === 'Enter' && (mobileMenuOpen = false)}
			aria-label="Close menu"
		></div>

		<!-- Drawer Content -->
		<div
			class="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 text-white rounded-t-2xl shadow-2xl z-50 max-h-[85vh] overflow-y-auto"
		>
			<div class="p-6">
				<!-- Header -->
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-bold">Flow Controls</h2>
					<button
						onclick={() => (mobileMenuOpen = false)}
						class="p-2 hover:bg-gray-800 rounded-lg transition-colors"
						aria-label="Close controls"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<!-- Upper Fluid Controls -->
				<div class="mb-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
					<div class="flex items-center justify-between mb-3">
						<h3 class="text-sm font-semibold text-blue-400">Upper Fluid (Oil)</h3>
						<div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-400/30"></div>
					</div>

					<label class="block mb-4">
						<span class="text-sm text-gray-300">Flow Rate: {upperFlowRate.toFixed(2)} m/s</span>
						<input
							type="range"
							bind:value={upperFlowRate}
							min="0"
							max="2"
							step="0.1"
							class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-2"
						/>
					</label>

					<label class="block">
						<span class="text-sm text-gray-300">Viscosity: {upperViscosity.toFixed(2)} Pa·s</span>
						<input
							type="range"
							bind:value={upperViscosity}
							min="0.5"
							max="5"
							step="0.1"
							class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-2"
						/>
					</label>
				</div>

				<!-- Lower Fluid Controls -->
				<div class="mb-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
					<div class="flex items-center justify-between mb-3">
						<h3 class="text-sm font-semibold text-orange-400">Lower Fluid (Water)</h3>
						<div class="w-4 h-4 rounded-full bg-orange-500 border-2 border-orange-400/30"></div>
					</div>

					<label class="block mb-4">
						<span class="text-sm text-gray-300">Flow Rate: {lowerFlowRate.toFixed(2)} m/s</span>
						<input
							type="range"
							bind:value={lowerFlowRate}
							min="0"
							max="2"
							step="0.1"
							class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-2"
						/>
					</label>

					<label class="block">
						<span class="text-sm text-gray-300">Viscosity: {lowerViscosity.toFixed(2)} Pa·s</span>
						<input
							type="range"
							bind:value={lowerViscosity}
							min="0.5"
							max="5"
							step="0.1"
							class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-2"
						/>
					</label>
				</div>

				<!-- Reset Button -->
				<button
					onclick={resetSimulation}
					class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg"
				>
					Reset Simulation
				</button>
			</div>
		</div>
	{/if}

	<!-- Mobile Footer with Creator Info -->
	<div
		class="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md text-white border-t border-gray-700/50 px-4 py-3 z-30"
	>
		<div class="flex items-center justify-center gap-2 text-xs text-gray-400">
			<span>Created by</span>
			<a
				href="https://github.com/ErenDexter"
				target="_blank"
				rel="noopener noreferrer"
				class="text-blue-400 hover:text-blue-300 transition-colors font-medium inline-flex items-center gap-1"
			>
				<span>Ranat Das Prangon</span>
				<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
					/>
				</svg>
			</a>
		</div>
	</div>
</main>

<style>
	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
		border: 2px solid #60a5fa;
	}

	input[type='range']::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
		border: 2px solid #60a5fa;
		border: none;
	}
</style>
