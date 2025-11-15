import { render, screen } from '@testing-library/react'
import Home from '../pages/index'

describe('Home', () => {
  it('renders a heading', () => {
    render(<Home />)

    const heading = screen.getByRole('heading', {
      name: /Custom Docs. One API. Infinite Audiences./i,
    })

    expect(heading).toBeInTheDocument()
  })
})
