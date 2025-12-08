import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import Usuario from "../models/usuario.model.mjs";

passport.use(
	"local-admin",
	new LocalStrategy(
		{
			usernameField: "email",
			passwordField: "password",
			passReqToCallback: false,
		},
		async (email, password, done) => {
			try {
				const usuario = await Usuario.autenticar(email, password, "ADMIN");

				if (!usuario) {
					return done(null, false, {
						message: "Email o contraseña incorrectos",
					});
				}

				return done(null, usuario);
			} catch (error) {
				return done(error);
			}
		}
	)
);

passport.use(
	"local-cliente",
	new LocalStrategy(
		{
			usernameField: "email",
			passwordField: "password",
			passReqToCallback: false,
		},
		async (email, password, done) => {
			try {
				const usuario = await Usuario.autenticar(email, password, "CLIENTE");

				if (!usuario) {
					return done(null, false, {
						message: "Email o contraseña incorrectos",
					});
				}

				return done(null, usuario);
			} catch (error) {
				return done(error);
			}
		}
	)
);

passport.serializeUser((user, done) => {
	done(null, { id: user._id.toString(), rol: user.rol });
});

passport.deserializeUser(async (sessionData, done) => {
	try {
		const usuario = await Usuario.findById(sessionData.id);
		if (!usuario) {
			return done(null, false);
		}
		done(null, usuario);
	} catch (error) {
		done(error);
	}
});

export default passport;
