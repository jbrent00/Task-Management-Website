import { getClerkAppearance } from './clerk-appearance';

describe('Clerk appearance', () => {
    it('maps resolved light and dark themes to the approved tokens', () => {
        expect(getClerkAppearance('light').variables).toMatchObject({ colorPrimary: '#B9472B', colorBackground: '#FCFCFA' });
        expect(getClerkAppearance('dark').variables).toMatchObject({ colorPrimary: '#F07A59', colorBackground: '#1C1C1F' });
    });
});
