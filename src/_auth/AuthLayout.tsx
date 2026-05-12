import { Outlet, Navigate } from "react-router-dom";

const AuthLayout = () => {
  const isAuthenticated = false;
  return (
    <>
      {isAuthenticated ? (
        <Navigate to="/" />
      ) : (
        <>
          <section className="relative flex flex-1 justify-center items-center flex-col py-10 overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary-600/20 blur-3xl -z-10 pointer-events-none" />
            <div className="absolute -bottom-40 -right-20 w-80 h-80 rounded-full bg-primary-500/10 blur-3xl -z-10 pointer-events-none" />
            <Outlet />
          </section>
          <img
            src="/assets/images/side-img.svg"
            alt="logo"
            className="hidden xl:block h-screen w-1/2 object-cover bg-no-repeat"
          />
        </>
      )}
    </>
  );
};

export default AuthLayout;
