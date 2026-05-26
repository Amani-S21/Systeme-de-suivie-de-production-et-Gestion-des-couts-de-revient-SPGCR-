import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Rafraîchissement automatique du token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isHomePage = request.nextUrl.pathname === "/";
  
  // Si l'utilisateur est authentifié et visite la racine ou la page de connexion,
  // on le redirige automatiquement vers le dashboard.
  if (user && (isAuthPage || isHomePage)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (!user && isDashboard) {
    // Non authentifié -> redirection login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isDashboard) {
    // Vérification du profil dans public.profiles (actif = true)
    const { data: profile } = await supabase
      .from('profiles')
      .select('actif')
      .eq('id', user.id)
      .single();

    if (!profile || profile.actif === false) {
      const url = request.nextUrl.clone();
      url.pathname = "/attente-validation";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
