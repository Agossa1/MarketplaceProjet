import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import FacebookStrategy from 'passport-facebook';
import User from "../models/UserModels.js";

// Google OAuth Strategy
passport.use(new GoogleStrategy.Strategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
        passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ oauthId: profile.id, oauthProvider: 'google' });
            if (!user) {
                user = new User({
                    oauthId: profile.id,
                    oauthProvider: 'google',
                    fullName: profile.displayName,
                    email: profile.emails[0].value,
                    verifiedEmail: true,
                });
                await user.save();
            }
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }
));

// Facebook OAuth Strategy
passport.use(new FacebookStrategy.Strategy(
    {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: '/auth/facebook/callback',
        passReqToCallback: true,
        profileFields: ['id', 'email', 'name']
    },
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ oauthId: profile.id, oauthProvider: 'facebook' });
            if (!user) {
                user = new User({
                    oauthId: profile.id,
                    oauthProvider: 'facebook',
                    fullName: `${profile.name.givenName} ${profile.name.familyName}`,
                    email: profile.emails[0].value,
                    verifiedEmail: true
                });
                await user.save();
            }
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }
));

export default passport;