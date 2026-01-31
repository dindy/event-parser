import { SignJWT } from 'jose'

export const updateTokenSession = async (res, auth, domain) => {

    // Set access token in cookie
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({
        authId: auth.id,
        mbzUserId: auth.mobilizonUserId,
        mobilizonAccessToken: auth.accessToken,
        mobilizonDomain: domain
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 year')
    .sign(secret);

    res.cookie('access_token', token, {
        httpOnly: true,
        // secure: true, @TODO: Force secure on prod
        sameSite: 'strict',
        maxAge: auth.refreshTokenExpiresIn * 1000
    });

    console.log('New token in cookie');
    
}