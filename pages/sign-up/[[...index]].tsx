import { SignUp } from "@clerk/nextjs";

const SignUpPage = () => {
  return (
    <main className="flex h-screen w-full items-center justify-center bg-black font-inter">
      <SignUp />
    </main>
  );
};

export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default SignUpPage;
