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
	class="fixed top-6 right-6 bg-gray-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl !px-2.5 !py-2 md:!p-4 w-96 border border-gray-700/50"
>
	<h2 class="text-xl md:text-2xl font-bold text-white">Flow Controls</h2>
	<div class="flex gap-2 md:flex-col">
		<div class="!mt-1.5 md:!mt-3 bg-gray-800/50 rounded-lg !p-2 border border-gray-700/30">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-sm md:text-base font-semibold text-blue-400">Upper Fluid (Oil)</h3>
				<div class="w-5 h-5 rounded-full bg-blue-500 border-2 border-blue-400/30"></div>
			</div>

			<label class="block mb-5">
				<span class="text-sm text-gray-300 font-medium"
					>Flow Rate: {upperFlowRate.toFixed(2)} m/s {upperFlowRate < 0
						? '←'
						: upperFlowRate > 0
							? '→'
							: ''}</span
				>
				<div class="relative mt-3">
					<div
						class="absolute left-1/2 -translate-x-1/2 -top-0.5 w-0.5 h-2.5 bg-gray-500 z-10"
					></div>
					<div class="absolute left-1/2 -translate-x-1/2 -bottom-2 text-[10px] text-gray-500">
						0
					</div>
					<input
						type="range"
						bind:value={upperFlowRate}
						min="-2"
						max="2"
						step="0.1"
						class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
					/>
				</div>
			</label>

			<label class="block !mt-0.5">
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

		<div class="!mt-1.5 md:!mt-3 bg-gray-800/50 rounded-lg !p-2 border border-gray-700/30">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-sm md:text-base font-semibold text-orange-400">Lower Fluid (Water)</h3>
				<div class="w-5 h-5 rounded-full bg-orange-500 border-2 border-orange-400/30"></div>
			</div>

			<label class="block mb-5">
				<span class="text-sm text-gray-300 font-medium"
					>Flow Rate: {lowerFlowRate.toFixed(2)} m/s {lowerFlowRate < 0
						? '←'
						: lowerFlowRate > 0
							? '→'
							: ''}</span
				>
				<div class="relative mt-3">
					<div
						class="absolute left-1/2 -translate-x-1/2 -top-0.5 w-0.5 h-2.5 bg-gray-500 z-10"
					></div>
					<div class="absolute left-1/2 -translate-x-1/2 -bottom-2 text-[10px] text-gray-500">
						0
					</div>
					<input
						type="range"
						bind:value={lowerFlowRate}
						min="-2"
						max="2"
						step="0.1"
						class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
					/>
				</div>
			</label>

			<label class="block !mt-0.5">
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
	</div>

	<button
		onclick={resetSimulation}
		class="w-full !mt-2 md:!mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold !py-1.5 !px-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl border border-blue-500/30"
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
