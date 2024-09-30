const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const jwtkey = "e-comm";

require("./db/config");

const User = require("./db/User");
const Product = require("./db/Product");

const app = express();
app.use(cors());
app.use(express.json());

// Register route
app.post("/register", async (req, res) => {
  try {
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password; // Remove password from response
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Registration failed" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  if (req.body.password && req.body.email) {
    try {
      const { email, password } = req.body;
      let user = await User.findOne({ email });

      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          jwt.sign({ userId: user._id }, jwtkey, { expiresIn: "2h" }, (err, token) => {
            if (err) {
              return res.status(500).send({ result: "Something went wrong, please try again later" });
            }
            res.send({ user: { email: user.email }, auth: token });
          }); // Ensure this parenthesis matches the `jwt.sign` function
        } else {
          res.status(401).send({ result: "Invalid credentials" });
        }
      } else {
        res.status(404).send({ result: "No user found" });
      }
    } catch (error) {
      res.status(500).send({ error: "Login failed" });
    }
  } else {
    res.status(400).send({ result: "Please provide email and password" });
  }
}); // Ensure this parenthesis matches the `app.post` function


// Add Product route
app.post("/add-product", async (req, res) => {
  try {
    let product = new Product(req.body);
    let result = await product.save();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Adding product failed" });
  }
});

// Get all products route
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    if (products.length > 0) {
      res.send(products);
    } else {
      res.status(404).send({ result: "No record found" });
    }
  } catch (error) {
    res.status(500).send({ error: "Fetching products failed" });
  }
});

// Delete product route
app.delete("/product/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).send({ error: "Invalid product ID" });
  }

  try {
    const result = await Product.deleteOne({ _id: req.params.id });
    if (result.deletedCount > 0) {
      res.send({ result: "Product deleted" });
    } else {
      res.status(404).send({ result: "Product not found" });
    }
  } catch (error) {
    res.status(500).send({ error: "Deleting product failed" });
  }
});

// Get product by ID route
app.get("/products/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).send({ error: "Invalid product ID" });
  }

  try {
    let result = await Product.findOne({ _id: req.params.id });
    if (result) {
      res.send(result);
    } else {
      res.status(404).send({ result: "No record found" });
    }
  } catch (error) {
    res.status(500).send({ error: "Fetching product failed" });
  }
});

app.put("/product/:id", async (req, res) => {
  let result = await Product.updateOne(
    { _id: req.params.id },
    {
      $set: req.body,
    }
  );
  res.send(result);
});

app.get("/search/:key", async (req, res) => {
  let result = await Product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
      { categery: { $regex: req.params.key } },
    ],
  });
  res.send(result);
});

app.listen(4000, () => {
  console.log("Server is running on port 4000");
});
