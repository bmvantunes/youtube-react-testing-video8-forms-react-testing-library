import { render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { MultiStepForm } from './MultiStepForm';
import user from '@testing-library/user-event';
import { check } from 'prettier';

describe('MultiStepForm', () => {
  const onSubmit = jest.fn();

  beforeEach(() => {
    onSubmit.mockClear();
    render(<MultiStepForm onSubmit={onSubmit} />);
  });

  it('onSubmit is called when all fields pass validation', async () => {
    user.type(getFirstName(), 'Bruno');
    selectJobSituation('Full-Time');
    user.type(getCity(), 'Vila Real');
    user.click(getMillionaireCheckbox());
    clickNextButton();

    // 2nd step
    user.type(await findMoney(), '1000000');
    clickNextButton();

    // 3rd step
    user.type(await findDescription(), 'hello');
    clickSubmitButton();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        city: 'Vila Real',
        description: 'hello',
        firstName: 'Bruno',
        job: 'FULL',
        millionaire: true,
        money: 1000000,
      });
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('has 3 required fields on first step', () => {
    // TODO
  });

  // TODO: more tests during the video
});

function clickSubmitButton() {
  user.click(screen.getByRole('button', { name: /Submit/i }));
}

function findDescription() {
  return screen.findByRole('textbox', { name: /Description/i });
}

function findMoney() {
  return screen.findByRole('spinbutton', { name: /All the money I have/i });
}

function clickNextButton() {
  user.click(screen.getByRole('button', { name: /Next/i }));
}

function getMillionaireCheckbox() {
  return screen.getByRole('checkbox', { name: /I am a millionaire/i });
}

function getCity() {
  return screen.getByRole('textbox', { name: /city/i });
}

function getFirstName() {
  return screen.getByRole('textbox', { name: /first name/i });
}

function selectJobSituation(jobSituation: string) {
  const dropdown = screen.getByRole('combobox', { name: /JOB situation/i });
  user.selectOptions(
    dropdown,
    within(dropdown).getByRole('option', { name: jobSituation })
  );
}
