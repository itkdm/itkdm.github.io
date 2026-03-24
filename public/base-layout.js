// Base layout client-side behavior: theme toggle, language switch, footer year, and global search shortcut.
// This file is loaded on every page; keep it lightweight and DOM-safe.

(function () {
	// Guard against running in non-browser environments
	if (typeof window === 'undefined' || typeof document === 'undefined') return;

	const root = document.body;
	const html = document.documentElement;
	const themeSelect = document.getElementById('themeSelect');
	const langBtn = document.getElementById('langBtn');
	const themeColorMeta = document.getElementById('themeColorMeta');
	const supportedThemes = ['light', 'paper', 'dark'];
	const themeMetaColors = {
		light: '#f7f5f1',
		paper: '#f7f3ea',
		dark: '#0b0e12',
	};

	function isSupportedTheme(theme) {
		return supportedThemes.includes(theme);
	}

	function updateThemeMeta(next) {
		if (themeColorMeta && themeMetaColors[next]) {
			themeColorMeta.setAttribute('content', themeMetaColors[next]);
		}
	}

	function setTheme(next) {
		if (!isSupportedTheme(next)) return;
		root.setAttribute('data-theme', next);
		html.setAttribute('data-theme', next);
		updateThemeMeta(next);
		if (themeSelect) {
			themeSelect.value = next;
		}
		try {
			localStorage.setItem('site-theme', next);
		} catch {}
	}

	function getAutoThemeByLocalTime() {
		try {
			const h = new Date().getHours();
			return h >= 18 || h < 6 ? 'dark' : 'light';
		} catch {
			return null;
		}
	}

	function isManualThemeSaved() {
		try {
			const saved = localStorage.getItem('site-theme');
			return isSupportedTheme(saved);
		} catch {
			return false;
		}
	}

	function applyAutoThemeIfNeeded() {
		if (isManualThemeSaved()) return;
		const autoTheme = getAutoThemeByLocalTime();
		if (autoTheme !== 'dark' && autoTheme !== 'light') return;
		root.setAttribute('data-theme', autoTheme);
		html.setAttribute('data-theme', autoTheme);
		updateThemeMeta(autoTheme);
	}

	// Sync body with the theme set on <html> by the inline head script
	(function syncInitialTheme() {
		const htmlTheme = html.getAttribute('data-theme');
		if (isSupportedTheme(htmlTheme)) {
			root.setAttribute('data-theme', htmlTheme);
			updateThemeMeta(htmlTheme);
			return;
		}

		let saved;
		try {
			saved = localStorage.getItem('site-theme');
		} catch {}

		if (isSupportedTheme(saved)) {
			setTheme(saved);
		} else {
			const autoTheme = getAutoThemeByLocalTime();
			if (autoTheme === 'dark' || autoTheme === 'light') {
				root.setAttribute('data-theme', autoTheme);
				html.setAttribute('data-theme', autoTheme);
				updateThemeMeta(autoTheme);
			} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
				setTheme('dark');
			} else {
				setTheme('light');
			}
		}
	})();

	if (themeSelect) {
		const current = root.getAttribute('data-theme') || html.getAttribute('data-theme') || 'light';
		if (isSupportedTheme(current)) {
			themeSelect.value = current;
		}
		themeSelect.addEventListener('change', (event) => {
			const nextTheme = event.target && 'value' in event.target ? event.target.value : 'light';
			setTheme(nextTheme);
		});
	}

	// Auto-adjust theme on visibility change / interval (only when in auto mode)
	applyAutoThemeIfNeeded();
	document.addEventListener('visibilitychange', () => {
		if (!document.hidden) applyAutoThemeIfNeeded();
	});
	setInterval(applyAutoThemeIfNeeded, 5 * 60 * 1000);

	// Language toggle button
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

	// Footer year
	const yearEl = document.getElementById('year');
	if (yearEl) {
		yearEl.textContent = String(new Date().getFullYear());
	}

	// Global search shortcut: Ctrl/Cmd + K
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

	// Mobile menu toggle
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

	// Close menu when clicking on a menu item
	if (mobileMenu) {
		const menuItems = mobileMenu.querySelectorAll('.mobile-menu-item');
		menuItems.forEach(item => {
			item.addEventListener('click', () => {
				// Small delay to allow navigation
				setTimeout(closeMobileMenu, 100);
			});
		});
	}

	// Close menu on escape key
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('active')) {
			closeMobileMenu();
		}
	});
})();

