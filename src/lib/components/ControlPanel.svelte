<script lang="ts">
	let {
		upperFlowRate = $bindable(0.5),
		lowerFlowRate = $bindable(0.3),
		upperViscosity = $bindable(1.0),
		lowerViscosity = $bindable(2.0)
	} = $props();

	function resetSimulation() {
		upperFlowRate = 0.5;
		lowerFlowRate = 0.3;
		upperViscosity = 1.0;
		lowerViscosity = 2.0;
	}
</script>

<div
	class="hidden md:block fixed top-6 right-6 bg-gray-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl !p-4 w-96 border border-gray-700/50"
>
	<h2 class="text-2xl font-bold mb-8 text-white">Flow Controls</h2>

	<!-- Upper Fluid Controls -->
	<div class="!mt-3 bg-gray-800/50 rounded-lg !p-2 border border-gray-700/30">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-base font-semibold text-blue-400">Upper Fluid (Oil)</h3>
			<div class="w-5 h-5 rounded-full bg-blue-500 border-2 border-blue-400/30"></div>
		</div>

		<label class="block mb-5">
			<span class="text-sm text-gray-300 font-medium"
				>Flow Rate: {upperFlowRate.toFixed(2)} m/s</span
			>
			<input
				type="range"
				bind:value={upperFlowRate}
				min="0"
				max="2"
				step="0.1"
				class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-3"
			/>
		</label>

		<label class="block">
			<span class="text-sm text-gray-300 font-medium"
				>Viscosity: {upperViscosity.toFixed(2)} Pa·s</span
			>
			<input
				type="range"
				bind:value={upperViscosity}
				min="0.5"
				max="5"
				step="0.1"
				class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-3"
			/>
		</label>
	</div>

	<!-- Lower Fluid Controls -->
	<div class="!mt-3 bg-gray-800/50 rounded-lg !p-2 border border-gray-700/30">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-base font-semibold text-orange-400">Lower Fluid (Water)</h3>
			<div class="w-5 h-5 rounded-full bg-orange-500 border-2 border-orange-400/30"></div>
		</div>

		<label class="block mb-5">
			<span class="text-sm text-gray-300 font-medium"
				>Flow Rate: {lowerFlowRate.toFixed(2)} m/s</span
			>
			<input
				type="range"
				bind:value={lowerFlowRate}
				min="0"
				max="2"
				step="0.1"
				class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-3"
			/>
		</label>

		<label class="block">
			<span class="text-sm text-gray-300 font-medium"
				>Viscosity: {lowerViscosity.toFixed(2)} Pa·s</span
			>
			<input
				type="range"
				bind:value={lowerViscosity}
				min="0.5"
				max="5"
				step="0.1"
				class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-3"
			/>
		</label>
	</div>

	<button
		onclick={resetSimulation}
		class="w-full !mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold !py-1.5 !px-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl border border-blue-500/30"
	>
		Reset Simulation
	</button>
</div>

<style>
	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
		border: 2px solid #60a5fa;
		transition: all 0.2s;
	}

	input[type='range']::-webkit-slider-thumb:hover {
		background: #2563eb;
		transform: scale(1.1);
	}

	input[type='range']::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
		border: 2px solid #60a5fa;
		transition: all 0.2s;
	}

	input[type='range']::-moz-range-thumb:hover {
		background: #2563eb;
		transform: scale(1.1);
	}
</style>
