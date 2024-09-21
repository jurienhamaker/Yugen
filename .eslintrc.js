var conventions = require('./node_modules/@paperless/conventions/.eslintrc');
var modified = Object.assign(conventions, {
	plugins: ['@nx', 'only-error', 'import', 'unicorn', 'ava'],
	settings: Object.assign(conventions.settings, {
		'import/resolver': Object.assign(conventions.settings['import/resolver'], {
			node: {
				project: ['tsconfig.base.json'],
			},
			typescript: Object.assign(
				conventions.settings['import/resolver'].typescript,
				{
					project: ['tsconfig.base.json'],
				}
			),
		}),
	}),
	overrides: [
		{
			files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
			rules: {
				'unicorn/prefer-top-level-await': 'off',
				'unicorn/no-null': 'off',
				'@angular-eslint/use-injectable-provided-in': 'off',
				'import/order': [
					'error',
					{
						pathGroups: [
							{
								pattern: '@yugen/externals',
								group: 'parent',
								position: 'after',
							},
							{
								pattern: '@yugen/general',
								group: 'parent',
								position: 'after',
							},
							{
								pattern: '@yugen/health',
								group: 'parent',
								position: 'after',
							},
							{
								pattern: '@yugen/shared',
								group: 'parent',
								position: 'after',
							},
							{
								pattern: '@yugen/util',
								group: 'parent',
								position: 'after',
							},
							{
								pattern: '@yugen/logs',
								group: 'parent',
								position: 'after',
							},
							{
								pattern: '@yugen/metrics',
								group: 'parent',
								position: 'after',
							},
							{
								pattern: '@yugen/prisma/koto',
								group: 'parent',
								position: 'after',
							},
							{
								pattern: '@yugen/prisma/kusari',
								group: 'parent',
								position: 'after',
							},
							{
								pattern: '@yugen/prisma/hoshi',
								group: 'parent',
								position: 'after',
							},
							{
								pattern: '@yugen/prisma/kazu',
								group: 'parent',
								position: 'after',
							},
							{
								pattern: '@yugen/koto/**',
								group: 'sibling',
								position: 'after',
							},
							{
								pattern: '@yugen/kusari/**',
								group: 'sibling',
								position: 'after',
							},
							{
								pattern: '@yugen/hoshi/**',
								group: 'sibling',
								position: 'after',
							},
							{
								pattern: '@yugen/kazu/**',
								group: 'sibling',
								position: 'after',
							},
						],
						pathGroupsExcludedImportTypes: ['builtin'],
						groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
						'newlines-between': 'always',
						alphabetize: {
							order: 'asc',
							caseInsensitive: true,
						},
					},
				],
			},
			extends: [
				'plugin:@angular-eslint/all',
				'plugin:@nx/angular',
				'plugin:@angular-eslint/template/process-inline-templates',
				'prettier',
			],
		},
		{
			files: ['*.html'],
			extends: ['plugin:@nx/angular-template'],
		},
		{
			files: ['*.ts', '*.tsx'],
			extends: [
				'plugin:@nx/typescript',
				'plugin:unicorn/all',
				'plugin:import/recommended',
			],
			rules: {
				'unicorn/no-null': 'off',
				'import/no-unresolved': 'off',
				'unicorn/prevent-abbreviations': 'off',
				'unicorn/no-nested-ternary': 'off',
				'unicorn/consistent-function-scoping': [
					'error',
					{
						checkArrowFunctions: false,
					},
				],
			},
		},
		{
			files: ['*.js', '*.jsx'],
			extends: ['plugin:@nx/javascript'],
		},
	],
});

module.exports = modified;
