( function () {
	console.log( 'Timeline work' );

	function toElement( el ) {
		return el instanceof jQuery ? el[ 0 ] : el;
	}

	function initTimelineAnimation( scopeEl ) {
		const el = toElement( scopeEl );

		if ( ! el || ! el.querySelector ) return;

		const wrapper = el.querySelector( '.timeline-wrapper' );
		const line = el.querySelector( '.timeline-line-animation' );
		if ( ! wrapper || ! line ) return;

		const animateEnabled = wrapper.querySelector(
			'.timeline-line-animation'
		);
		if ( ! animateEnabled ) return;

		let currentHeight = 0;

		const observer = new IntersectionObserver( ( entries ) => {
			entries.forEach( ( entry ) => {
				const trigger = entry.target;
				const parentBlock = trigger.closest( 'li' );
				if ( ! parentBlock ) return;
				parentBlock.classList.toggle(
					'is-stuck',
					entry.isIntersecting
				);
			} );
		} );

        
		const triggers = el.querySelectorAll( '.tl-trigger' );
		triggers.forEach( ( trigger ) => observer.observe( trigger ) );

		function getTargetHeight() {
			const rect = wrapper.getBoundingClientRect();
			const screenMiddle = window.innerHeight / 2;
			if ( rect.top < screenMiddle && rect.bottom > 0 ) {
				const progress = Math.min(
					1,
					( screenMiddle - rect.top ) / rect.height
				);
				return rect.height * progress;
			}
			return 0;
		}

		function animate() {
			const targetHeight = getTargetHeight();
			currentHeight += ( targetHeight - currentHeight ) * 0.1;
			if ( Math.abs( currentHeight - targetHeight ) < 0.5 ) {
				currentHeight = targetHeight;
			}
			line.style.height = `${ currentHeight }px`;
			requestAnimationFrame( animate );
		}

		animate();
		window.addEventListener( 'scroll', () =>
			requestAnimationFrame( animate )
		);
		window.addEventListener( 'resize', () =>
			requestAnimationFrame( animate )
		);
	}

	function initAllWidgets() {
		const widgets = document.querySelectorAll(
			'[data-widget_type="za-timeline.default"]'
		);
		widgets.forEach( ( el ) => initTimelineAnimation( el ) );
	}

	document.addEventListener( 'DOMContentLoaded', () => {
		initAllWidgets();

		// Elementor hook: when widget is rendered
		if (
			window.elementorFrontend &&
			typeof elementorFrontend.hooks !== 'undefined'
		) {
			elementorFrontend.hooks.addAction(
				'frontend/element_ready/za-timeline.default',
				initTimelineAnimation
			);
		} else {
			const waitForElementor = setInterval( () => {
				if ( window.elementorFrontend && elementorFrontend.hooks ) {
					clearInterval( waitForElementor );
					elementorFrontend.hooks.addAction(
						'frontend/element_ready/za-timeline.default',
						initTimelineAnimation
					);
				}
			}, 100 );
		}

		// In Elementor Editor: Keeping an Eye on Dynamic Inserts
		if (
			window.elementorFrontend &&
			elementorFrontend.isEditMode &&
			elementorFrontend.isEditMode()
		) {
			const observer = new MutationObserver( () => {
				initAllWidgets();
			} );
			observer.observe( document.body, {
				childList: true,
				subtree: true,
			} );
		}
	} );
} )();
