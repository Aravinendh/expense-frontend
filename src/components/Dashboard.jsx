import React, { useState, useEffect } from 'react'
import axios from 'axios'

function Dashboard({ setIsLoggedIn }) {
  const [expenses, setExpenses] = useState([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [splitWith, setSplitWith] = useState([{ username: '', share: 0 }])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setExpenses(response.data)
    } catch (err) {
      setError('Failed to fetch expenses')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    setIsLoggedIn(false)
  }

  const handleAddSplitUser = () => {
    setSplitWith([...splitWith, { username: '', share: 0 }])
  }

  const handleRemoveSplitUser = (index) => {
    const newSplitWith = splitWith.filter((_, i) => i !== index)
    setSplitWith(newSplitWith)
  }

  const handleSplitUserChange = (index, field, value) => {
    const newSplitWith = [...splitWith]
    newSplitWith[index][field] = value
    setSplitWith(newSplitWith)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const userName = localStorage.getItem('userName')
      
      // Calculate current user's share
      const othersTotal = splitWith.reduce((sum, split) => sum + Number(split.share), 0)
      const myShare = Number(amount) - othersTotal

      const splitBetween = [
        { username: userName, share: myShare },
        ...splitWith.map(split => ({
          username: split.username,
          share: Number(split.share)
        }))
      ]

      await axios.post('/api/expenses', {
        description,
        amount: Number(amount),
        splitBetween
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setDescription('')
      setAmount('')
      setSplitWith([{ username: '', share: 0 }])
      fetchExpenses()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create expense')
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="add-expense">
        <h3>Add New Expense</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Description:</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Amount:</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="split-with-section">
            <h4>Split With:</h4>
            {splitWith.map((split, index) => (
              <div key={index} className="split-user-row">
                <input
                  type="text"
                  placeholder="Username"
                  value={split.username}
                  onChange={(e) => handleSplitUserChange(index, 'username', e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Share amount"
                  value={split.share}
                  onChange={(e) => handleSplitUserChange(index, 'share', e.target.value)}
                  required
                />
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSplitUser(index)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddSplitUser}
              className="add-user-btn"
            >
              Add Another User
            </button>
          </div>

          <div className="share-summary">
            <p>Your share: ₹{amount ? (Number(amount) - splitWith.reduce((sum, split) => sum + Number(split.share), 0)).toFixed(2) : '0.00'}</p>
          </div>

          <button type="submit" className="submit-btn">Add Expense</button>
        </form>
      </div>

      <div className="expenses-list">
        <h3>Your Expenses</h3>
        {expenses.map((expense) => (
          <div key={expense._id} className="expense-item">
            <div className="expense-info">
              <h4>{expense.description}</h4>
              <p>Amount: ₹{expense.amount}</p>
              <p>Split between:</p>
              <ul>
                {expense.splitBetween.map((split, index) => (
                  <li key={index}>
                    {split.username}: ₹{split.share}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
