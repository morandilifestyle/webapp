declare global {
    var testUtils: {
        createTestUser: () => {
            email: string;
            password: string;
            firstName: string;
            lastName: string;
        };
        fakeJwt: (id?: string) => string;
    };
}
declare global {
    var mockDB: {
        users: Map<string, any>;
        carts: Map<string, any[]>;
        wishlists: Map<string, any[]>;
    };
}
export {};
//# sourceMappingURL=setup.d.ts.map