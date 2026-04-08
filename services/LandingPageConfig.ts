// ============================================================================
// LANDING PAGE CONFIGURATION
// ============================================================================
// Edit this file to change ANY content on the Landing Page.
// No code changes needed — just update the values below and refresh.
// ============================================================================

export const landingConfig = {
    // ── Branding ──────────────────────────────────────────────────────────────
    branding: {
        title: 'PSA Aurora',
        subtitle: 'Provincial Statistics Office',
        logoIcon: 'BarChart3',
    },

    // ── Navigation Links ─────────────────────────────────────────────────────
    navigation: [
        { name: 'Services', href: '#services' },
        { name: 'Updates', href: '#updates' },
        { name: 'Charter', href: '#charter' },
        { name: 'Contact', href: '#contact' },
    ],

    // ── Hero Section ─────────────────────────────────────────────────────────
    hero: {
        badge: 'Official Provincial Repository • Region III',
        headlineParts: [
            { text: 'Pioneering Provincial', highlight: false },
            { text: 'Data Integrity.', highlight: true },
        ],
        description:
            'Trusted civil registration and accurate regional statistics for every citizen of the resilient province of Aurora, Philippines.',
        primaryCTA: { label: 'Staff Dashboard', href: '/dashboard' },
        secondaryCTA: { label: 'Public Portal', href: '#services' },
    },

    // ── Hero Statistics ──────────────────────────────────────────────────────
    stats: [
        { iconName: 'Users', label: 'Registered Citizens', value: '214K+', numericValue: 214000 },
        { iconName: 'Activity', label: 'Sync Status', value: '100%', numericValue: 100 },
        { iconName: 'MapPin', label: 'Districts Covered', value: '8 Units', numericValue: 8 },
        { iconName: 'Database', label: 'System Reliability', value: '99.9%', numericValue: 99.9 },
    ],

    // ── Services / Features Grid ─────────────────────────────────────────────
    services: {
        sectionTag: 'Core Architecture',
        sectionTitle: 'The Provincial Hub.',
        sectionDescription:
            'Centralized management for the 8 municipalities of Aurora, optimized for speed and maximum data security.',
        items: [
            {
                title: 'Registry Archive',
                description:
                    'Official archival of Birth, Marriage, and Death certificates with province-wide encrypted lookup.',
                iconName: 'ShieldCheck',
                variant: 'primary' as const, // blue bg, large card
                ctaLabel: 'Launch Search Engine',
                span: 2, // col-span-2
            },
            {
                title: 'PhilSys Sync',
                description:
                    'Direct provincial access for National ID registration and automated municipal verification.',
                iconName: 'Fingerprint',
                variant: 'glass' as const,
                badge: 'Online',
                span: 1,
            },
            {
                title: 'Property Logistics',
                description:
                    'Supply inventory control and provincial asset management for district offices.',
                iconName: 'Database',
                variant: 'dark' as const, // dark bg card
                ctaLabel: 'Control Center',
                span: 1,
            },
            {
                title: 'Statistical Analytics',
                description:
                    'Provincial economic mapping, census processing, and demographics analysis hub.',
                iconName: 'BarChart3',
                variant: 'wide-glass' as const, // wide glass card
                badge: 'Live Q4 Data',
                badgeVariant: 'success' as const,
                statusText: 'Global Sync Status: Healthy',
                span: 2,
            },
        ],
    },

    // ── Updates / News Feed ──────────────────────────────────────────────────
    updates: {
        sectionTag: 'Provincial Newsroom',
        sectionTitle: 'The Latest Advisories.',
        sectionDescription:
            'Stay updated with official schedules, mobile mission routes, and public notices from PSA Aurora.',
        items: [
            {
                title: 'Digital Census 2025: Aurora Pilot Program Launch',
                tag: 'Strategic',
                date: '31 Dec 2024',
                iconName: 'Zap',
                featured: true,
            },
            {
                title: 'New PhilSys Kiosks deployed in Dilasag & Dingalan',
                tag: 'Deployment',
                date: '28 Dec 2024',
                iconName: 'MapPin',
                featured: false,
            },
            {
                title: 'Registry Modernization Summit 2025: Key Results',
                tag: 'Research',
                date: '20 Dec 2024',
                iconName: 'FileText',
                featured: false,
            },
            {
                title: 'Baler Provincial Office Schedule: Year-End Notice',
                tag: 'Advisory',
                date: '15 Dec 2024',
                iconName: 'Calendar',
                featured: false,
            },
        ],
    },

    // ── Footer ───────────────────────────────────────────────────────────────
    footer: {
        tagline: ['Integrity in data.', 'Service in Aurora.'],
        contact: {
            phone: '(042) 724-4389',
            email: 'aurora@psa.gov.ph',
        },
        address: {
            line1: 'N. Roxas St., Suklayin',
            line2: 'Baler, Aurora 3200',
        },
        socialLinks: [
            { label: 'FB', url: '#' },
            { label: 'X', url: '#' },
            { label: 'LI', url: '#' },
        ],
        bottomLinks: ['Transparency Seal', 'Data Privacy', 'Accessibility'],
        copyright:
            '© 2025 Republic of the Philippines • PSA Aurora Provincial Office • Region III',
        portal: {
            label: 'Explore the Philippine Statistics Authority National Website.',
            url: 'https://psa.gov.ph',
            ctaLabel: 'Explore Main',
        },
    },
};
