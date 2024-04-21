# PassPocket

PassPocket is a simple password manager.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installing

Clone the repository to your local machine:

```sh
git clone https://github.com/Xytrux/passpocket.git
cd passpocket
```

Install the project dependencies:

```sh
npm install
```

### Running the Application
To start the application, run:

```sh
npm start
```

### Building the Application
To build the application for Windows, run:

```sh
npm run package
```

To build the application specifically for Linux, run:

```sh
npm run package-linux
```

The built application will be located in the same directory.

### Making DEB and RPM packages
To make the packages for Linux, run:

```sh
npm run dist -- --linux
```

### Making installer for Windows
To make the installer for Windows, run:

```sh
npm run dist
```

## Authors
- [Xytrux](https://github.com/Xytrux) - Initial work
- [CallenDV](https://github.com/CallenDV) - Web version

### License
This project is licensed under the MIT License.

### Contact
For any inquiries, you can reach out to helloworldpy103@gmail.com.

### Acknowledgments
- Thanks to Electron and the open-source community for making this project possible.