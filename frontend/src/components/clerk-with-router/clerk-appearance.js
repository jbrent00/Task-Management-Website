export function getClerkAppearance(resolvedTheme) {
  const dark = resolvedTheme === 'dark'
  return {
    variables: {
      colorPrimary: dark ? '#F07A59' : '#B9472B',
      colorBackground: dark ? '#1C1C1F' : '#FCFCFA',
      colorInputBackground: dark ? '#242428' : '#FFFFFF',
      colorInputText: dark ? '#F2F1ED' : '#1B1B1F',
      colorText: dark ? '#F2F1ED' : '#1B1B1F',
      colorTextSecondary: dark ? '#A6A4A0' : '#69686F',
      colorDanger: dark ? '#F07B7B' : '#B53B3B',
      borderRadius: '10px',
      fontFamily: '"Geist Variable", sans-serif',
    },
    elements: {
      cardBox: { boxShadow: 'none' },
      card: { border: `1px solid ${dark ? '#343438' : '#DAD9D4'}`, boxShadow: 'none' },
      formButtonPrimary: { boxShadow: 'none' },
      footerActionLink: { color: dark ? '#F07A59' : '#B9472B' },
    },
  };
}
