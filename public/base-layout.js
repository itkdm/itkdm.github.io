(function () {
	if (typeof window === 'undefined' || typeof document === 'undefined') return;

	const html = document.documentElement;
	const langBtn = document.getElementById('langBtn');
	const overlayHeaders = document.querySelectorAll('[data-overlay-header="true"]');

	const syncOverlayHeaders = () => {
		overlayHeaders.forEach((header) => header.classList.toggle('is-scrolled', window.scrollY > 40));
	};
	if (overlayHeaders.length) {
		syncOverlayHeaders();
		window.addEventListener('scroll', syncOverlayHeaders, { passive: true });
	}

	if (langBtn) {
		langBtn.addEventListener('click', () => {
			const htmlEl = document.documentElement;
			const curLang = htmlEl.getAttribute('lang') || 'zh';
			const altPathFromServer = langBtn.getAttribute('data-alt-path');

			const deriveAltPath = () => {
				const segments = (window.location.pathname || '/').split('/');
				if (segments.length > 1 && (segments[1] === 'zh' || segments[1] === 'en')) {
					segments[1] = segments[1] === 'zh' ? 'en' : 'zh';
					return segments.join('/') || '/';
				}
				return `/${curLang === 'zh' ? 'en' : 'zh'}/`;
			};

			const currentPathname = window.location.pathname;
			const targetPath =
				altPathFromServer && altPathFromServer !== currentPathname ? altPathFromServer : deriveAltPath();

			const u = new URL(window.location.href);
			u.pathname = targetPath;
			window.location.href = u.toString();
		});
	}

	const yearEl = document.getElementById('year');
	if (yearEl) {
		yearEl.textContent = String(new Date().getFullYear());
	}

	document.addEventListener('keydown', (e) => {
		if (!(e.ctrlKey || e.metaKey) || e.key !== 'k') return;

		const activeElement = document.activeElement;
		const isInputFocused =
			activeElement &&
			(activeElement.tagName === 'INPUT' ||
				activeElement.tagName === 'TEXTAREA' ||
				activeElement.isContentEditable);

		if (isInputFocused) return;

		e.preventDefault();
		const currentLang = html.getAttribute('lang') || 'zh';
		window.location.href = `/${currentLang}/search/`;
	});

	const mobileMenuBtn = document.getElementById('mobileMenuBtn');
	const mobileMenu = document.getElementById('mobileMenu');
	const mobileMenuClose = document.getElementById('mobileMenuClose');
	const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');

	function openMobileMenu() {
		if (mobileMenu) mobileMenu.classList.add('active');
		if (mobileMenuOverlay) mobileMenuOverlay.classList.add('active');
		document.body.style.overflow = 'hidden';
	}

	function closeMobileMenu() {
		if (mobileMenu) mobileMenu.classList.remove('active');
		if (mobileMenuOverlay) mobileMenuOverlay.classList.remove('active');
		document.body.style.overflow = '';
	}

	if (mobileMenuBtn) {
		mobileMenuBtn.addEventListener('click', openMobileMenu);
	}

	if (mobileMenuClose) {
		mobileMenuClose.addEventListener('click', closeMobileMenu);
	}

	if (mobileMenuOverlay) {
		mobileMenuOverlay.addEventListener('click', closeMobileMenu);
	}

	if (mobileMenu) {
		const menuItems = mobileMenu.querySelectorAll('.mobile-menu-item');
		menuItems.forEach(item => {
			item.addEventListener('click', () => {
				setTimeout(closeMobileMenu, 100);
			});
		});
	}

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('active')) {
			closeMobileMenu();
		}
	});
})();
