import { render } from '@testing-library/react';
import React from 'react';
import { MultiStepForm } from './MultiStepForm';

describe('MultiStepForm', () => {
  const onSubmit = jest.fn();

  beforeEach(() => {
    onSubmit.mockClear();
    render(<MultiStepForm onSubmit={onSubmit} />);
  });

  it('onSubmit is called when all fields pass validation', () => {
    // TODO
  });

  it('has 3 required fields on first step', () => {
    // TODO
  });

  // TODO: more tests during the video
});
