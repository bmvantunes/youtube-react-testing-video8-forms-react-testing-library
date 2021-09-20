import { MultiStepForm } from '../components/MultiStepForm';

export default function Home() {
  return (
    <MultiStepForm
      onSubmit={(values) => {
        console.log('Form Submitted', values);
      }}
    />
  );
}
