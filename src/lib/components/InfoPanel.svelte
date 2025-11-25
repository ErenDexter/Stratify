<script lang="ts">
	import VelocityGraph from './VelocityGraph.svelte';

	let {
		upperFlowRate = 0.5,
		lowerFlowRate = 0.3,
		upperViscosity = 1.0,
		lowerViscosity = 2.0
	} = $props();

	let activeTab = $state<'info' | 'graph'>('info');
	let isPanelOpen = $state(true);
</script>

{#if !isPanelOpen}
	<button
		onclick={() => (isPanelOpen = true)}
		class="md:hidden fixed bottom-2 left-4 z-50 bg-gray-900/95 backdrop-blur-md text-white !p-3 rounded-full shadow-xl border border-gray-700/50 transition-all duration-300 hover:bg-gray-800"
		aria-label="Show info panel"
	>
		<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
	</button>
{/if}

<div
	class="fixed md:bottom-6 !ml-1 md:!ml-0 md:left-6 !px-3 !py-2 md:!p-4 bg-gray-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl w-full md:w-[420px] border border-gray-700/50 transition-all duration-300 ease-out
		{isPanelOpen
		? 'bottom-3 opacity-100'
		: '-bottom-full opacity-0 pointer-events-none'} md:bottom-6 md:opacity-100 md:pointer-events-auto"
>
	<div class="md:hidden flex items-center justify-between">
		<div class="flex items-center gap-2">
			<img src="/favicon.svg" alt="Stratify logo" class="w-4 h-4" />
			<span class="text-base text-gray-500 font-medium">Stratify</span>
		</div>
		<button
			onclick={() => (isPanelOpen = false)}
			class="!p-1 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-400 hover:text-white"
			aria-label="Hide panel"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>
	</div>

	<div class="md:hidden relative !mb-1.5 !-mt-1">
		<div class="flex border-b border-gray-700/50">
			<button
				onclick={() => (activeTab = 'info')}
				class="flex-1 !py-2.5 !px-3 text-sm font-medium transition-colors {activeTab === 'info'
					? 'text-blue-400'
					: 'text-gray-500 hover:text-gray-300'}"
			>
				Info
			</button>
			<button
				onclick={() => (activeTab = 'graph')}
				class="flex-1 !py-2.5 !px-3 text-sm font-medium transition-colors {activeTab === 'graph'
					? 'text-blue-400'
					: 'text-gray-500 hover:text-gray-300'}"
			>
				Velocity Graph
			</button>
		</div>
		<div
			class="absolute bottom-0 h-0.5 bg-blue-500 transition-all duration-300 ease-out"
			style="width: 50%; left: {activeTab === 'info' ? '0%' : '50%'}"
		></div>
	</div>

	<div class={activeTab === 'info' ? 'block' : 'hidden md:block'}>
		<h2 class="hidden md:flex items-center gap-2.5 text-xl md:text-2xl font-bold text-white">
			<img src="/favicon.svg" alt="Stratify logo" class="w-5 h-5" />
			Stratify
		</h2>

		<p class="text-sm md:text-base text-gray-300 !mb-2 leading-relaxed">
			Interactive two-phase stratified flow simulation in a horizontal pipe with momentum transfer.
		</p>

		<div class="!mb-2">
			<div class="bg-gray-800/50 rounded-lg !px-2.5 !py-1.5 border border-gray-700/30">
				<h3 class="text-sm font-semibold text-gray-200 !mb-1">Controls</h3>
				<div class="!space-y-0.5 text-sm text-gray-300">
					<div class="flex items-center gap-3">
						<span>Left click + drag to rotate view</span>
					</div>
					<div class="flex items-center gap-3">
						<span>Scroll to zoom in/out</span>
					</div>
				</div>
			</div>
		</div>

		<div class="!pt-2 border-t border-gray-700/50 text-xs">
			<div class="text-gray-500 !mb-1">Built with SvelteKit • Three.js • TailwindCSS</div>
			<div class="flex items-center gap-2 text-gray-400">
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
	</div>

	<div class="md:hidden {activeTab === 'graph' ? 'flex justify-center' : 'hidden'}">
		<VelocityGraph
			{upperFlowRate}
			{lowerFlowRate}
			{upperViscosity}
			{lowerViscosity}
			isMobile={true}
		/>
	</div>
</div>
