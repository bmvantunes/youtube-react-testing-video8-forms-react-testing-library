import { act, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { MultiStepForm } from './MultiStepForm';
import user from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { DefaultRequestBody, matchRequestUrl, MockedRequest, rest } from 'msw';

const server = setupServer(
  rest.post<DefaultRequestBody, { ok: boolean }>(
    '/api/my-beautiful-endpoint',
    (_, res, ctx) => {
      return res(ctx.delay(1), ctx.json({ ok: true }));
    }
  )
);

beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

// By default we have 5 seconds timeout per test
// Depending on the delay you add to your HTTP calls, you might want
// to increase the timeout to like 30 seconds (probably 30 is a bit too much, but yeah...)
jest.setTimeout(30000);

describe('MultiStepForm', () => {
  const onSubmit = jest.fn();

  beforeEach(() => {
    onSubmit.mockClear();
    render(<MultiStepForm onSubmit={onSubmit} />);
  });

  it('YouTube Comment Request: Do the same test but with an HTTP call instead of onSubmit', async () => {
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

    // we need to create our waitForRequest before clicking next
    const waitingPromiseForRequest = waitForRequest(
      'POST',
      '/api/my-beautiful-endpoint'
    );

    // click the next button - this will start the HTTP call
    clickSubmitButton();

    // now we just need to wait for the request to happen
    const request = await waitingPromiseForRequest;

    // I will only recommend this approch if you have no changes on your UI to validate against a "getByText or getByRole".
    // You should only do this in POSTs, "never" in GETs, because with a GET you'll have the ui changing, and you can test against your changing UI which is much better test than checking the request body like we did here :)
    // From the docs:
    // Adding such assertions, however, is implementation details testing and is highly discouraged. Asserting requests in such way is testing how your application is written, instead of what it does.
    // URL: https://mswjs.io/docs/recipes/request-assertions
    expect(request.body).toEqual({
      city: 'Vila Real',
      description: 'hello',
      firstName: 'Bruno',
      job: 'FULL',
      millionaire: true,
      money: 1000000,
    });

    // The HTTP call is done on server side, but client side we still have some things happening, so we need to wait for them to finish
    await waitForLastStepToBeCompleted();
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

  it('has 3 required fields on first step', async () => {
    clickNextButton();

    await waitFor(() => {
      expect(getFirstName()).toHaveErrorMessage('Your First Name is Required');
    });

    expect(getCity()).toHaveErrorMessage('city is a required field');
    expect(getSelectJobSituation()).toHaveErrorMessage(
      'You need to select your job situation'
    );
  });

  describe('city field', () => {
    it('shows error when city has less than 8 chars', async () => {
      user.type(getCity(), 'Vila');
      user.tab();

      await waitFor(() => {
        expect(getCity()).toHaveErrorMessage(
          'city must be at least 8 characters'
        );
      });
    });

    it('shows error when city has more than 11 chars', async () => {
      user.type(getCity(), 'Vila Real12312313123');
      user.tab();

      await waitFor(() => {
        expect(getCity()).toHaveErrorMessage(
          'city must be at most 11 characters'
        );
      });
    });
  });

  describe('first name field', () => {
    it('shows error when first name has more than 5 chars', async () => {
      user.type(getFirstName(), 'Carlos');
      user.tab();

      await waitFor(() => {
        expect(getFirstName()).toHaveErrorMessage(
          `Your name can't be longer than 5 chars`
        );
      });
    });
  });

  describe('money field', () => {
    it('shows error when money is lower than 1000000 and millionaire selected', async () => {
      user.type(getFirstName(), 'Bruno');
      selectJobSituation('Full-Time');
      user.type(getCity(), 'Vila Real');
      user.click(getMillionaireCheckbox());
      clickNextButton();

      // 2nd step
      user.type(await findMoney(), '100');
      clickNextButton();

      await waitFor(async () => {
        expect(await findMoney()).toHaveErrorMessage(
          'Because you said you are a millionaire you need to have 1 million'
        );
      });
    });
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

function getSelectJobSituation() {
  return screen.getByRole('combobox', { name: /JOB situation/i });
}

function selectJobSituation(jobSituation: string) {
  const dropdown = getSelectJobSituation();
  user.selectOptions(
    dropdown,
    within(dropdown).getByRole('option', { name: jobSituation })
  );
}

async function waitForRequest(method: string, url: string) {
  /**
   * You can make this a global function to use in multiple files :)
   * You can see this technique described in the docs at:
   * https://mswjs.io/docs/extensions/life-cycle-events#asserting-request-payload
   */
  let requestId = '';
  const result = new Promise<MockedRequest>((resolve, reject) => {
    server.events.on('request:start', (req) => {
      const matchesMethod = req.method.toLowerCase() === method.toLowerCase();
      const matchesUrl = matchRequestUrl(req.url, url);
      if (matchesMethod && matchesUrl) {
        requestId = req.id;
      }
    });
    server.events.on('request:end', (req) => {
      if (req.id === requestId) {
        resolve(req);
      }
    });
    server.events.on('request:unhandled', (req) => {
      if (req.id === requestId) {
        reject(
          new Error(`The ${req.method} ${req.url.href} request was unhandled.`)
        );
      }
    });
  });

  // // thanks to formik, we need to do the next "beautiful 5 lines"
  // // if you are not using formik, you can return the promise directly
  let finalResult: Partial<MockedRequest<DefaultRequestBody>> = {};

  await act(async () => {
    finalResult = await result;
  });

  return finalResult;
}

async function waitForLastStepToBeCompleted() {
  // when everything is settled we change the "more info" icon at the top to a checkmark!
  await waitFor(() => {
    expect(screen.getByText(/more info/i)).toHaveClass(
      'MuiStepLabel-completed'
    );
  });
}
