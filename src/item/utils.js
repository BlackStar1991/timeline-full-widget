export function getComputedRel( linkTarget, rel ) {
	return (
		[
			linkTarget === '_blank' ? 'noopener' : '',
			linkTarget === '_blank' ? 'noreferrer' : '',
			rel && rel !== 'true' ? rel : '',
		]
			.filter( Boolean )
			.join( ' ' ) || undefined
	);
}
