import { SignIn } from "@clerk/nextjs";

const SignInPage = () => {
  return (
    <main className="flex h-screen w-full items-center justify-center bg-black font-inter">
      <SignIn />
    </main>
  );
};

export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default SignInPage;
