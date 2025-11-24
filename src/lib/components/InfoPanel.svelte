<div
	class="hidden md:block fixed bottom-6 left-6 !p-4 bg-gray-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl p-8 w-[420px] border border-gray-700/50"
>
	<h2 class="text-2xl font-bold mb-5 text-white">Stratify</h2>

	<p class="text-base text-gray-300 mb-6 leading-relaxed">
		Interactive two-phase stratified flow simulation in a horizontal pipe with fluid mechanics.
	</p>

	<div class="mb-6">
		<div class="bg-gray-800/50 rounded-lg border border-gray-700/30 !mt-2 !p-2">
			<h3 class="text-sm font-semibold text-gray-200">Fluid Layers</h3>
			<div class="!space-y-1 text-sm text-gray-300 !mt-1">
				<div class="flex items-center gap-3">
					<div
						class="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-400/30 flex-shrink-0"
					></div>
					<span>Upper fluid (Oil) - Lower density</span>
				</div>
				<div class="flex items-center gap-3">
					<div
						class="w-4 h-4 rounded-full bg-orange-500 border-2 border-orange-400/30 flex-shrink-0"
					></div>
					<span>Lower fluid (Water) - Higher density</span>
				</div>
			</div>
		</div>

		<div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30 !mt-3 !p-2">
			<h3 class="text-sm font-semibold text-gray-200 mb-3">Controls</h3>
			<div class="!space-y-1 text-sm text-gray-300 !mt-1">
				<div class="flex items-center gap-3">
					<span>Left click + drag to rotate view</span>
				</div>
				<div class="flex items-center gap-3">
					<span>Scroll to zoom in/out</span>
				</div>
			</div>
		</div>
	</div>

	<div class="pt-5 border-t border-gray-700/50 text-xs !mt-3">
		<div class="text-gray-500 mb-2">Built with SvelteKit • Three.js • TailwindCSS</div>
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
